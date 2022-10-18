import { LendingPoolV4 } from './../../types/LendingPoolV4.d';
import BigNumber from 'bignumber.js';
import { APPROVAL_AMOUNT_LENDING_POOL, oneEther } from '../../helpers/constants';
import { convertToCurrencyDecimals } from '../../helpers/contracts-helpers';
import { DRE } from '../../helpers/misc-utils';
import { ProtocolErrors, RateMode } from '../../helpers/types';
import { makeSuite } from './helpers/make-suite';
import { LendingPoolV4Factory, RefundableLendingPoolFactory } from '../../types';
import { deployStarlayLibraries } from '../../helpers/contracts-deployments';
import { getLendingPoolAddressesProvider } from '../../helpers/contracts-getters';
import { parseEther } from 'ethers/lib/utils';

const chai = require('chai');
const { expect } = chai;

makeSuite('LendingPool upgrade - lending pool upgrade', (testEnv) => {
  it('can be upgraded', async () => {
    const { dai, weth, usdc, deployer, users, pool, oracle, configurator } = testEnv;
    const depositor = users[0];
    const borrower = users[1];
    const dummyLeverager = users[2];

    await configurator.enableReserveStableRate(weth.address);
    await configurator.enableReserveStableRate(usdc.address);

    //mints DAI to depositor
    await dai.connect(depositor.signer).mint(await convertToCurrencyDecimals(dai.address, '2000'));

    //approve protocol to access depositor wallet
    await dai.connect(depositor.signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);

    //mints DAI to dummyLeverager
    await dai
      .connect(dummyLeverager.signer)
      .mint(await convertToCurrencyDecimals(dai.address, '2000'));

    //approve protocol to access dummyLeverager wallet
    await dai.connect(dummyLeverager.signer).approve(pool.address, parseEther('2000'));

    //user 1 deposits 1000 DAI
    const amountDAItoDeposit = await convertToCurrencyDecimals(dai.address, '1000');
    await pool
      .connect(depositor.signer)
      .deposit(dai.address, amountDAItoDeposit, depositor.address, '0');

    const amountETHtoDeposit = await convertToCurrencyDecimals(weth.address, '1');

    //mints WETH to borrower
    await weth.connect(borrower.signer).mint(amountETHtoDeposit);

    //approve protocol to access borrower wallet
    await weth.connect(borrower.signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);

    //user 2 deposits 1 WETH
    await pool
      .connect(borrower.signer)
      .deposit(weth.address, amountETHtoDeposit, borrower.address, '0');

    //user 2 borrows
    const userGlobalData = await pool.getUserAccountData(borrower.address);
    const daiPrice = await oracle.getAssetPrice(dai.address);

    const amountDAIToBorrow = await convertToCurrencyDecimals(
      dai.address,
      new BigNumber(userGlobalData.availableBorrowsETH.toString())
        .div(daiPrice.toString())
        .multipliedBy(0.95)
        .toFixed(0)
    );

    await pool
      .connect(borrower.signer)
      .borrow(dai.address, amountDAIToBorrow, RateMode.Variable, '0', borrower.address);

    const userGlobalDataAfter = await pool.getUserAccountData(borrower.address);

    expect(userGlobalDataAfter.currentLiquidationThreshold.toString()).to.be.bignumber.equal(
      '8500',
      'Invalid liquidation threshold'
    );

    // Upgrade lending pool to RefundableLendingPool
    const libs = await deployStarlayLibraries();
    const refundablePoolImpl = await new RefundableLendingPoolFactory(
      await deployStarlayLibraries(),
      deployer.signer
    ).deploy(dummyLeverager.address);
    const addressProvider = await getLendingPoolAddressesProvider();
    addressProvider.connect(deployer.signer).setLendingPoolImpl(refundablePoolImpl.address);

    // leverager can be deposited 1,000 DAI
    const refundablePool = RefundableLendingPoolFactory.connect(pool.address, deployer.signer);
    expect(await dai.balanceOf(dummyLeverager.address)).to.be.equal(parseEther('2000'));
    const adminBalanceBefore = await dai.balanceOf(deployer.address);
    await refundablePool.refundFromLeverager(dai.address);
    expect(await dai.balanceOf(dummyLeverager.address)).to.be.equal(parseEther('0'));
    const adminBalanceAfter = await dai.balanceOf(deployer.address);
    expect(await adminBalanceAfter.sub(adminBalanceBefore)).to.be.equal(parseEther('2000'));

    // Upgrade lending pool to LendingPoolV4
    const poolV4 = await new LendingPoolV4Factory(libs, deployer.signer).deploy();
    addressProvider.connect(deployer.signer).setLendingPoolImpl(poolV4.address);
    // user 1 deposits more 1,000 DAI
    await pool
      .connect(depositor.signer)
      .deposit(dai.address, amountDAItoDeposit, depositor.address, '0');
    const borrowerData = await pool.getUserAccountData(borrower.address);
    expect(userGlobalDataAfter.currentLiquidationThreshold.toString()).to.be.bignumber.equal(
      '8500',
      'Invalid liquidation threshold'
    );
  });
});
