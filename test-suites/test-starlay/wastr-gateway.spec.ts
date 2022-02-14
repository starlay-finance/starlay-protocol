import { BigNumber } from 'ethers';
import { parseEther } from 'ethers/lib/utils';
import { MAX_UINT_AMOUNT } from '../../helpers/constants';
import { deploySelfdestructTransferMock } from '../../helpers/contracts-deployments';
import { getStableDebtToken, getVariableDebtToken } from '../../helpers/contracts-getters';
import { convertToCurrencyDecimals } from '../../helpers/contracts-helpers';
import { DRE, waitForTx } from '../../helpers/misc-utils';
import { makeSuite, TestEnv } from './helpers/make-suite';

const { expect } = require('chai');

makeSuite('Use native ETH at LendingPool via WASTRGateway', (testEnv: TestEnv) => {
  const zero = BigNumber.from('0');
  const depositSize = parseEther('5');
  const daiSize = parseEther('10000');
  it('Deposit WETH via WastrGateway and DAI', async () => {
    const { users, wastrGateway, lWETH, pool } = testEnv;

    const user = users[1];
    const depositor = users[0];

    // Deposit liquidity with native ETH
    await wastrGateway
      .connect(depositor.signer)
      .depositASTR(pool.address, depositor.address, '0', { value: depositSize });

    // Deposit with native ETH
    await wastrGateway
      .connect(user.signer)
      .depositASTR(pool.address, user.address, '0', { value: depositSize });

    const lTokensBalance = await lWETH.balanceOf(user.address);

    expect(lTokensBalance).to.be.gt(zero);
    expect(lTokensBalance).to.be.gte(depositSize);
  });

  it('Withdraw WETH - Partial', async () => {
    const { users, wastrGateway, lWETH, pool } = testEnv;

    const user = users[1];
    const priorEthersBalance = await user.signer.getBalance();
    const lTokensBalance = await lWETH.balanceOf(user.address);

    expect(lTokensBalance).to.be.gt(zero, 'User should have lTokens.');

    // Partially withdraw native ETH
    const partialWithdraw = await convertToCurrencyDecimals(lWETH.address, '2');

    // Approve the lTokens to Gateway so Gateway can withdraw and convert to Ether
    const approveTx = await lWETH
      .connect(user.signer)
      .approve(wastrGateway.address, MAX_UINT_AMOUNT);
    const { gasUsed: approveGas } = await waitForTx(approveTx);

    // Partial Withdraw and send native Ether to user
    const { gasUsed: withdrawGas } = await waitForTx(
      await wastrGateway
        .connect(user.signer)
        .withdrawASTR(pool.address, partialWithdraw, user.address)
    );

    const afterPartialEtherBalance = await user.signer.getBalance();
    const afterPartialLTokensBalance = await lWETH.balanceOf(user.address);
    const gasCosts = approveGas.add(withdrawGas).mul(approveTx.gasPrice);

    expect(afterPartialEtherBalance).to.be.equal(
      priorEthersBalance.add(partialWithdraw).sub(gasCosts),
      'User ETHER balance should contain the partial withdraw'
    );
    expect(afterPartialLTokensBalance).to.be.equal(
      lTokensBalance.sub(partialWithdraw),
      'User lWETH balance should be substracted'
    );
  });

  it('Withdraw WETH - Full', async () => {
    const { users, lWETH, wastrGateway, pool } = testEnv;

    const user = users[1];
    const priorEthersBalance = await user.signer.getBalance();
    const lTokensBalance = await lWETH.balanceOf(user.address);

    expect(lTokensBalance).to.be.gt(zero, 'User should have lTokens.');

    // Approve the lTokens to Gateway so Gateway can withdraw and convert to Ether
    const approveTx = await lWETH
      .connect(user.signer)
      .approve(wastrGateway.address, MAX_UINT_AMOUNT);
    const { gasUsed: approveGas } = await waitForTx(approveTx);

    // Full withdraw
    const { gasUsed: withdrawGas } = await waitForTx(
      await wastrGateway
        .connect(user.signer)
        .withdrawASTR(pool.address, MAX_UINT_AMOUNT, user.address)
    );

    const afterFullEtherBalance = await user.signer.getBalance();
    const afterFullLTokensBalance = await lWETH.balanceOf(user.address);
    const gasCosts = approveGas.add(withdrawGas).mul(approveTx.gasPrice);

    expect(afterFullEtherBalance).to.be.eq(
      priorEthersBalance.add(lTokensBalance).sub(gasCosts),
      'User ETHER balance should contain the full withdraw'
    );
    expect(afterFullLTokensBalance).to.be.eq(0, 'User lWETH balance should be zero');
  });

  it('Borrow stable WETH and Full Repay with ETH', async () => {
    const { users, wastrGateway, lDai, weth, dai, pool, helpersContract } = testEnv;
    const borrowSize = parseEther('1');
    const repaySize = borrowSize.add(borrowSize.mul(5).div(100));
    const user = users[1];
    const depositor = users[0];

    // Deposit with native ETH
    await wastrGateway
      .connect(depositor.signer)
      .depositASTR(pool.address, depositor.address, '0', { value: depositSize });

    const { stableDebtTokenAddress } = await helpersContract.getReserveTokensAddresses(
      weth.address
    );

    const stableDebtToken = await getStableDebtToken(stableDebtTokenAddress);

    // Deposit 10000 DAI
    await dai.connect(user.signer).mint(daiSize);
    await dai.connect(user.signer).approve(pool.address, daiSize);
    await pool.connect(user.signer).deposit(dai.address, daiSize, user.address, '0');

    const lTokensBalance = await lDai.balanceOf(user.address);

    expect(lTokensBalance).to.be.gt(zero);
    expect(lTokensBalance).to.be.gte(daiSize);

    // Borrow WETH with WETH as collateral
    await waitForTx(
      await pool.connect(user.signer).borrow(weth.address, borrowSize, '1', '0', user.address)
    );

    const debtBalance = await stableDebtToken.balanceOf(user.address);

    expect(debtBalance).to.be.gt(zero);

    // Full Repay WETH with native ETH
    await waitForTx(
      await wastrGateway
        .connect(user.signer)
        .repayASTR(pool.address, MAX_UINT_AMOUNT, '1', user.address, { value: repaySize })
    );

    const debtBalanceAfterRepay = await stableDebtToken.balanceOf(user.address);
    expect(debtBalanceAfterRepay).to.be.eq(zero);

    // Withdraw DAI
    await lDai.connect(user.signer).approve(pool.address, MAX_UINT_AMOUNT);
    await pool.connect(user.signer).withdraw(dai.address, MAX_UINT_AMOUNT, user.address);
  });

  it('Borrow variable WETH and Full Repay with ETH', async () => {
    const { users, wastrGateway, lWETH, weth, pool, helpersContract } = testEnv;
    const borrowSize = parseEther('1');
    const repaySize = borrowSize.add(borrowSize.mul(5).div(100));
    const user = users[1];

    const { variableDebtTokenAddress } = await helpersContract.getReserveTokensAddresses(
      weth.address
    );

    const varDebtToken = await getVariableDebtToken(variableDebtTokenAddress);

    // Deposit with native ETH
    await wastrGateway
      .connect(user.signer)
      .depositASTR(pool.address, user.address, '0', { value: depositSize });

    const lTokensBalance = await lWETH.balanceOf(user.address);

    expect(lTokensBalance).to.be.gt(zero);
    expect(lTokensBalance).to.be.gte(depositSize);

    // Borrow WETH with WETH as collateral
    await waitForTx(
      await pool.connect(user.signer).borrow(weth.address, borrowSize, '2', '0', user.address)
    );

    const debtBalance = await varDebtToken.balanceOf(user.address);

    expect(debtBalance).to.be.gt(zero);

    // Partial Repay WETH loan with native ETH
    const partialPayment = repaySize.div(2);
    await waitForTx(
      await wastrGateway
        .connect(user.signer)
        .repayASTR(pool.address, partialPayment, '2', user.address, { value: partialPayment })
    );

    const debtBalanceAfterPartialRepay = await varDebtToken.balanceOf(user.address);
    expect(debtBalanceAfterPartialRepay).to.be.lt(debtBalance);

    // Full Repay WETH loan with native ETH
    await waitForTx(
      await wastrGateway
        .connect(user.signer)
        .repayASTR(pool.address, MAX_UINT_AMOUNT, '2', user.address, { value: repaySize })
    );
    const debtBalanceAfterFullRepay = await varDebtToken.balanceOf(user.address);
    expect(debtBalanceAfterFullRepay).to.be.eq(zero);
  });

  it('Borrow ETH via delegateApprove ETH and repays back', async () => {
    const { users, wastrGateway, lWETH, weth, helpersContract, pool } = testEnv;
    const borrowSize = parseEther('1');
    const user = users[2];
    const { variableDebtTokenAddress } = await helpersContract.getReserveTokensAddresses(
      weth.address
    );
    const varDebtToken = await getVariableDebtToken(variableDebtTokenAddress);

    const priorDebtBalance = await varDebtToken.balanceOf(user.address);
    expect(priorDebtBalance).to.be.eq(zero);

    // Deposit WETH with native ETH
    await wastrGateway
      .connect(user.signer)
      .depositASTR(pool.address, user.address, '0', { value: depositSize });

    const lTokensBalance = await lWETH.balanceOf(user.address);

    expect(lTokensBalance).to.be.gt(zero);
    expect(lTokensBalance).to.be.gte(depositSize);

    // Delegates borrowing power of WETH to WASTRGateway
    await waitForTx(
      await varDebtToken.connect(user.signer).approveDelegation(wastrGateway.address, borrowSize)
    );

    // Borrows ETH with WETH as collateral
    await waitForTx(
      await wastrGateway.connect(user.signer).borrowASTR(pool.address, borrowSize, '2', '0')
    );

    const debtBalance = await varDebtToken.balanceOf(user.address);

    expect(debtBalance).to.be.gt(zero);

    // Full Repay WETH loan with native ETH
    await waitForTx(
      await wastrGateway
        .connect(user.signer)
        .repayASTR(pool.address, MAX_UINT_AMOUNT, '2', user.address, { value: borrowSize.mul(2) })
    );
    const debtBalanceAfterFullRepay = await varDebtToken.balanceOf(user.address);
    expect(debtBalanceAfterFullRepay).to.be.eq(zero);
  });

  it('Should revert if receiver function receives Ether if not WETH', async () => {
    const { users, wastrGateway } = testEnv;
    const user = users[0];
    const amount = parseEther('1');

    // Call receiver function (empty data + value)
    await expect(
      user.signer.sendTransaction({
        to: wastrGateway.address,
        value: amount,
        gasLimit: DRE.network.config.gas,
      })
    ).to.be.revertedWith('Receive not allowed');
  });

  it('Should revert if fallback functions is called with Ether', async () => {
    const { users, wastrGateway } = testEnv;
    const user = users[0];
    const amount = parseEther('1');
    const fakeABI = ['function wantToCallFallback()'];
    const abiCoder = new DRE.ethers.utils.Interface(fakeABI);
    const fakeMethodEncoded = abiCoder.encodeFunctionData('wantToCallFallback', []);

    // Call fallback function with value
    await expect(
      user.signer.sendTransaction({
        to: wastrGateway.address,
        data: fakeMethodEncoded,
        value: amount,
        gasLimit: DRE.network.config.gas,
      })
    ).to.be.revertedWith('Fallback not allowed');
  });

  it('Should revert if fallback functions is called', async () => {
    const { users, wastrGateway } = testEnv;
    const user = users[0];

    const fakeABI = ['function wantToCallFallback()'];
    const abiCoder = new DRE.ethers.utils.Interface(fakeABI);
    const fakeMethodEncoded = abiCoder.encodeFunctionData('wantToCallFallback', []);

    // Call fallback function without value
    await expect(
      user.signer.sendTransaction({
        to: wastrGateway.address,
        data: fakeMethodEncoded,
        gasLimit: DRE.network.config.gas,
      })
    ).to.be.revertedWith('Fallback not allowed');
  });

  it('Owner can do emergency token recovery', async () => {
    const { users, dai, wastrGateway, deployer } = testEnv;
    const user = users[0];
    const amount = parseEther('1');

    await dai.connect(user.signer).mint(amount);
    const daiBalanceAfterMint = await dai.balanceOf(user.address);

    await dai.connect(user.signer).transfer(wastrGateway.address, amount);
    const daiBalanceAfterBadTransfer = await dai.balanceOf(user.address);
    expect(daiBalanceAfterBadTransfer).to.be.eq(
      daiBalanceAfterMint.sub(amount),
      'User should have lost the funds here.'
    );

    await wastrGateway
      .connect(deployer.signer)
      .emergencyTokenTransfer(dai.address, user.address, amount);
    const daiBalanceAfterRecovery = await dai.balanceOf(user.address);

    expect(daiBalanceAfterRecovery).to.be.eq(
      daiBalanceAfterMint,
      'User should recover the funds due emergency token transfer'
    );
  });

  it('Owner can do emergency native ETH recovery', async () => {
    const { users, wastrGateway, deployer } = testEnv;
    const user = users[0];
    const amount = parseEther('1');
    const userBalancePriorCall = await user.signer.getBalance();

    // Deploy contract with payable selfdestruct contract
    const selfdestructContract = await deploySelfdestructTransferMock();

    // Selfdestruct the mock, pointing to WASTRGateway address
    const callTx = await selfdestructContract
      .connect(user.signer)
      .destroyAndTransfer(wastrGateway.address, { value: amount });
    const { gasUsed } = await waitForTx(callTx);
    const gasFees = gasUsed.mul(callTx.gasPrice);
    const userBalanceAfterCall = await user.signer.getBalance();

    expect(userBalanceAfterCall).to.be.eq(userBalancePriorCall.sub(amount).sub(gasFees), '');
    ('User should have lost the funds');

    // Recover the funds from the contract and sends back to the user
    await wastrGateway.connect(deployer.signer).emergencyAstarTransfer(user.address, amount);

    const userBalanceAfterRecovery = await user.signer.getBalance();
    const wastrGatewayAfterRecovery = await DRE.ethers.provider.getBalance(wastrGateway.address);

    expect(userBalanceAfterRecovery).to.be.eq(
      userBalancePriorCall.sub(gasFees),
      'User should recover the funds due emergency eth transfer.'
    );
    expect(wastrGatewayAfterRecovery).to.be.eq('0', 'WASTRGateway ether balance should be zero.');
  });
});
