import { Zero } from '@ethersproject/constants';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import { BUIDLEREVM_CHAINID } from '../../helpers/buidler-constants';
import { MAX_UINT_AMOUNT } from '../../helpers/constants';
import { deployUniswapRepayAdapter } from '../../helpers/contracts-deployments';
import { getMockUniswapRouter } from '../../helpers/contracts-getters';
import {
  buildPermitParams,
  buildRepayAdapterParams,
  convertToCurrencyDecimals,
  getContract,
  getSignatureFromTypedData,
} from '../../helpers/contracts-helpers';
import { DRE, evmRevert, evmSnapshot } from '../../helpers/misc-utils';
import { eContractid } from '../../helpers/types';
import { VariableDebtToken } from '../../types';
import { MockUniswapV2Router02 } from '../../types/MockUniswapV2Router02';
import { StableDebtToken } from '../../types/StableDebtToken';
import { makeSuite, TestEnv } from './helpers/make-suite';
const { parseEther } = ethers.utils;

const { expect } = require('chai');

makeSuite('Uniswap adapters', (testEnv: TestEnv) => {
  let mockUniswapRouter: MockUniswapV2Router02;
  let evmSnapshotId: string;

  before(async () => {
    mockUniswapRouter = await getMockUniswapRouter();
  });

  beforeEach(async () => {
    evmSnapshotId = await evmSnapshot();
  });

  afterEach(async () => {
    await evmRevert(evmSnapshotId);
  });

  describe('UniswapRepayAdapter', () => {
    beforeEach(async () => {
      const { users, weth, dai, usdc, aave, pool, deployer } = testEnv;
      const userAddress = users[0].address;

      // Provide liquidity
      await dai.mint(parseEther('20000'));
      await dai.approve(pool.address, parseEther('20000'));
      await pool.deposit(dai.address, parseEther('20000'), deployer.address, 0);

      const usdcLiquidity = await convertToCurrencyDecimals(usdc.address, '2000000');
      await usdc.mint(usdcLiquidity);
      await usdc.approve(pool.address, usdcLiquidity);
      await pool.deposit(usdc.address, usdcLiquidity, deployer.address, 0);

      await weth.mint(parseEther('100'));
      await weth.approve(pool.address, parseEther('100'));
      await pool.deposit(weth.address, parseEther('100'), deployer.address, 0);

      await aave.mint(parseEther('1000000'));
      await aave.approve(pool.address, parseEther('1000000'));
      await pool.deposit(aave.address, parseEther('1000000'), deployer.address, 0);

      // Make a deposit for user
      await weth.mint(parseEther('1000'));
      await weth.approve(pool.address, parseEther('1000'));
      await pool.deposit(weth.address, parseEther('1000'), userAddress, 0);

      await aave.mint(parseEther('1000000'));
      await aave.approve(pool.address, parseEther('1000000'));
      await pool.deposit(aave.address, parseEther('1000000'), userAddress, 0);

      await usdc.mint(usdcLiquidity);
      await usdc.approve(pool.address, usdcLiquidity);
      await pool.deposit(usdc.address, usdcLiquidity, userAddress, 0);
    });

    describe('constructor', () => {
      it('should deploy with correct parameters', async () => {
        const { addressesProvider, weth } = testEnv;
        await deployUniswapRepayAdapter([
          addressesProvider.address,
          mockUniswapRouter.address,
          weth.address,
        ]);
      });

      it('should revert if not valid addresses provider', async () => {
        const { weth } = testEnv;
        await expect(
          deployUniswapRepayAdapter([
            mockUniswapRouter.address,
            mockUniswapRouter.address,
            weth.address,
          ])
        ).to.be.reverted;
      });
    });

    describe('executeOperation', () => {
      it('should correctly swap tokens and repay debt', async () => {
        const { users, pool, weth, aWETH, oracle, dai, uniswapRepayAdapter, helpersContract } =
          testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await convertToCurrencyDecimals(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const expectedDaiAmount = await convertToCurrencyDecimals(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString()).div(daiPrice.toString()).toFixed(0)
        );

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const daiStableDebtTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).stableDebtTokenAddress;

        const daiStableDebtContract = await getContract<StableDebtToken>(
          eContractid.StableDebtToken,
          daiStableDebtTokenAddress
        );

        const userDaiStableDebtAmountBefore = await daiStableDebtContract.balanceOf(userAddress);

        const liquidityToSwap = amountWETHtoSwap;
        await aWETH.connect(user).approve(uniswapRepayAdapter.address, liquidityToSwap);
        const userLEthBalanceBefore = await aWETH.balanceOf(userAddress);

        await mockUniswapRouter.connect(user).setAmountToSwap(weth.address, liquidityToSwap);

        const flashLoanDebt = new BigNumber(expectedDaiAmount.toString())
          .multipliedBy(1.0009)
          .toFixed(0);

        await mockUniswapRouter.setAmountIn(
          flashLoanDebt,
          weth.address,
          dai.address,
          liquidityToSwap
        );

        const params = buildRepayAdapterParams(
          weth.address,
          liquidityToSwap,
          1,
          0,
          0,
          0,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          false
        );

        await expect(
          pool
            .connect(user)
            .flashLoan(
              uniswapRepayAdapter.address,
              [dai.address],
              [expectedDaiAmount.toString()],
              [0],
              userAddress,
              params,
              0
            )
        )
          .to.emit(uniswapRepayAdapter, 'Swapped')
          .withArgs(weth.address, dai.address, liquidityToSwap.toString(), flashLoanDebt);

        const adapterWethBalance = await weth.balanceOf(uniswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(uniswapRepayAdapter.address);
        const userDaiStableDebtAmount = await daiStableDebtContract.balanceOf(userAddress);
        const userLEthBalance = await aWETH.balanceOf(userAddress);

        expect(adapterWethBalance).to.be.eq(Zero);
        expect(adapterDaiBalance).to.be.eq(Zero);
        expect(userDaiStableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiStableDebtAmount).to.be.lt(expectedDaiAmount);
        expect(userLEthBalance).to.be.lt(userLEthBalanceBefore);
        expect(userLEthBalance).to.be.gte(userLEthBalanceBefore.sub(liquidityToSwap));
      });

      it('should correctly swap tokens and repay debt with permit', async () => {
        const { users, pool, weth, aWETH, oracle, dai, uniswapRepayAdapter, helpersContract } =
          testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await convertToCurrencyDecimals(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const expectedDaiAmount = await convertToCurrencyDecimals(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString()).div(daiPrice.toString()).toFixed(0)
        );

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const daiStableDebtTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).stableDebtTokenAddress;

        const daiStableDebtContract = await getContract<StableDebtToken>(
          eContractid.StableDebtToken,
          daiStableDebtTokenAddress
        );

        const userDaiStableDebtAmountBefore = await daiStableDebtContract.balanceOf(userAddress);

        const liquidityToSwap = amountWETHtoSwap;
        const userLEthBalanceBefore = await aWETH.balanceOf(userAddress);

        const chainId = DRE.network.config.chainId || BUIDLEREVM_CHAINID;
        const deadline = MAX_UINT_AMOUNT;
        const nonce = (await aWETH._nonces(userAddress)).toNumber();
        const msgParams = buildPermitParams(
          chainId,
          aWETH.address,
          '1',
          await aWETH.name(),
          userAddress,
          uniswapRepayAdapter.address,
          nonce,
          deadline,
          liquidityToSwap.toString()
        );

        const ownerPrivateKey = require('../../test-wallets.js').accounts[1].secretKey;
        if (!ownerPrivateKey) {
          throw new Error('INVALID_OWNER_PK');
        }

        const { v, r, s } = getSignatureFromTypedData(ownerPrivateKey, msgParams);

        await mockUniswapRouter.connect(user).setAmountToSwap(weth.address, liquidityToSwap);

        const flashLoanDebt = new BigNumber(expectedDaiAmount.toString())
          .multipliedBy(1.0009)
          .toFixed(0);

        await mockUniswapRouter.setAmountIn(
          flashLoanDebt,
          weth.address,
          dai.address,
          liquidityToSwap
        );

        const params = buildRepayAdapterParams(
          weth.address,
          liquidityToSwap,
          1,
          liquidityToSwap,
          deadline,
          v,
          r,
          s,
          false
        );

        await expect(
          pool
            .connect(user)
            .flashLoan(
              uniswapRepayAdapter.address,
              [dai.address],
              [expectedDaiAmount.toString()],
              [0],
              userAddress,
              params,
              0
            )
        )
          .to.emit(uniswapRepayAdapter, 'Swapped')
          .withArgs(weth.address, dai.address, liquidityToSwap.toString(), flashLoanDebt);

        const adapterWethBalance = await weth.balanceOf(uniswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(uniswapRepayAdapter.address);
        const userDaiStableDebtAmount = await daiStableDebtContract.balanceOf(userAddress);
        const userLEthBalance = await aWETH.balanceOf(userAddress);

        expect(adapterWethBalance).to.be.eq(Zero);
        expect(adapterDaiBalance).to.be.eq(Zero);
        expect(userDaiStableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiStableDebtAmount).to.be.lt(expectedDaiAmount);
        expect(userLEthBalance).to.be.lt(userLEthBalanceBefore);
        expect(userLEthBalance).to.be.gte(userLEthBalanceBefore.sub(liquidityToSwap));
      });

      it('should revert if caller not lending pool', async () => {
        const { users, pool, weth, aWETH, oracle, dai, uniswapRepayAdapter } = testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await convertToCurrencyDecimals(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const expectedDaiAmount = await convertToCurrencyDecimals(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString()).div(daiPrice.toString()).toFixed(0)
        );

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const liquidityToSwap = amountWETHtoSwap;
        await aWETH.connect(user).approve(uniswapRepayAdapter.address, liquidityToSwap);

        await mockUniswapRouter.connect(user).setAmountToSwap(weth.address, liquidityToSwap);

        const params = buildRepayAdapterParams(
          weth.address,
          liquidityToSwap,
          1,
          0,
          0,
          0,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          false
        );

        await expect(
          uniswapRepayAdapter
            .connect(user)
            .executeOperation(
              [dai.address],
              [expectedDaiAmount.toString()],
              [0],
              userAddress,
              params
            )
        ).to.be.revertedWith('CALLER_MUST_BE_LENDING_POOL');
      });

      it('should revert if there is not debt to repay with the specified rate mode', async () => {
        const { users, pool, weth, oracle, dai, uniswapRepayAdapter, aWETH } = testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await convertToCurrencyDecimals(weth.address, '10');

        await weth.connect(user).mint(amountWETHtoSwap);
        await weth.connect(user).transfer(uniswapRepayAdapter.address, amountWETHtoSwap);

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const expectedDaiAmount = await convertToCurrencyDecimals(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString()).div(daiPrice.toString()).toFixed(0)
        );

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 2, 0, userAddress);

        const liquidityToSwap = amountWETHtoSwap;
        await aWETH.connect(user).approve(uniswapRepayAdapter.address, liquidityToSwap);

        await mockUniswapRouter.connect(user).setAmountToSwap(weth.address, liquidityToSwap);

        const params = buildRepayAdapterParams(
          weth.address,
          liquidityToSwap,
          1,
          0,
          0,
          0,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          false
        );

        await expect(
          pool
            .connect(user)
            .flashLoan(
              uniswapRepayAdapter.address,
              [dai.address],
              [expectedDaiAmount.toString()],
              [0],
              userAddress,
              params,
              0
            )
        ).to.be.reverted;
      });

      it('should revert if there is not debt to repay', async () => {
        const { users, pool, weth, oracle, dai, uniswapRepayAdapter, aWETH } = testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await convertToCurrencyDecimals(weth.address, '10');

        await weth.connect(user).mint(amountWETHtoSwap);
        await weth.connect(user).transfer(uniswapRepayAdapter.address, amountWETHtoSwap);

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const expectedDaiAmount = await convertToCurrencyDecimals(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString()).div(daiPrice.toString()).toFixed(0)
        );

        const liquidityToSwap = amountWETHtoSwap;
        await aWETH.connect(user).approve(uniswapRepayAdapter.address, liquidityToSwap);

        await mockUniswapRouter.connect(user).setAmountToSwap(weth.address, liquidityToSwap);

        const params = buildRepayAdapterParams(
          weth.address,
          liquidityToSwap,
          1,
          0,
          0,
          0,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          false
        );

        await expect(
          pool
            .connect(user)
            .flashLoan(
              uniswapRepayAdapter.address,
              [dai.address],
              [expectedDaiAmount.toString()],
              [0],
              userAddress,
              params,
              0
            )
        ).to.be.reverted;
      });

      it('should revert when max amount allowed to swap is bigger than max slippage', async () => {
        const { users, pool, weth, oracle, dai, aWETH, uniswapRepayAdapter } = testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await convertToCurrencyDecimals(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const expectedDaiAmount = await convertToCurrencyDecimals(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString()).div(daiPrice.toString()).toFixed(0)
        );

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const bigMaxAmountToSwap = amountWETHtoSwap.mul(2);
        await aWETH.connect(user).approve(uniswapRepayAdapter.address, bigMaxAmountToSwap);

        await mockUniswapRouter.connect(user).setAmountToSwap(weth.address, bigMaxAmountToSwap);

        const flashLoanDebt = new BigNumber(expectedDaiAmount.toString())
          .multipliedBy(1.0009)
          .toFixed(0);

        await mockUniswapRouter.setAmountIn(
          flashLoanDebt,
          weth.address,
          dai.address,
          bigMaxAmountToSwap
        );

        const params = buildRepayAdapterParams(
          weth.address,
          bigMaxAmountToSwap,
          1,
          0,
          0,
          0,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          false
        );

        await expect(
          pool
            .connect(user)
            .flashLoan(
              uniswapRepayAdapter.address,
              [dai.address],
              [expectedDaiAmount.toString()],
              [0],
              userAddress,
              params,
              0
            )
        ).to.be.revertedWith('maxAmountToSwap exceed max slippage');
      });

      it('should swap, repay debt and pull the needed LTokens leaving no leftovers', async () => {
        const { users, pool, weth, aWETH, oracle, dai, uniswapRepayAdapter, helpersContract } =
          testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await convertToCurrencyDecimals(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const expectedDaiAmount = await convertToCurrencyDecimals(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString()).div(daiPrice.toString()).toFixed(0)
        );

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const daiStableDebtTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).stableDebtTokenAddress;

        const daiStableDebtContract = await getContract<StableDebtToken>(
          eContractid.StableDebtToken,
          daiStableDebtTokenAddress
        );

        const userDaiStableDebtAmountBefore = await daiStableDebtContract.balanceOf(userAddress);

        const liquidityToSwap = amountWETHtoSwap;
        await aWETH.connect(user).approve(uniswapRepayAdapter.address, liquidityToSwap);
        const userLEthBalanceBefore = await aWETH.balanceOf(userAddress);
        const userWethBalanceBefore = await weth.balanceOf(userAddress);

        const actualWEthSwapped = new BigNumber(liquidityToSwap.toString())
          .multipliedBy(0.995)
          .toFixed(0);

        await mockUniswapRouter.connect(user).setAmountToSwap(weth.address, actualWEthSwapped);

        const flashLoanDebt = new BigNumber(expectedDaiAmount.toString())
          .multipliedBy(1.0009)
          .toFixed(0);

        await mockUniswapRouter.setAmountIn(
          flashLoanDebt,
          weth.address,
          dai.address,
          actualWEthSwapped
        );

        const params = buildRepayAdapterParams(
          weth.address,
          liquidityToSwap,
          1,
          0,
          0,
          0,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          false
        );

        await expect(
          pool
            .connect(user)
            .flashLoan(
              uniswapRepayAdapter.address,
              [dai.address],
              [expectedDaiAmount.toString()],
              [0],
              userAddress,
              params,
              0
            )
        )
          .to.emit(uniswapRepayAdapter, 'Swapped')
          .withArgs(weth.address, dai.address, actualWEthSwapped.toString(), flashLoanDebt);

        const adapterWethBalance = await weth.balanceOf(uniswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(uniswapRepayAdapter.address);
        const userDaiStableDebtAmount = await daiStableDebtContract.balanceOf(userAddress);
        const userLEthBalance = await aWETH.balanceOf(userAddress);
        const adapterLEthBalance = await aWETH.balanceOf(uniswapRepayAdapter.address);
        const userWethBalance = await weth.balanceOf(userAddress);

        expect(adapterLEthBalance).to.be.eq(Zero);
        expect(adapterWethBalance).to.be.eq(Zero);
        expect(adapterDaiBalance).to.be.eq(Zero);
        expect(userDaiStableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiStableDebtAmount).to.be.lt(expectedDaiAmount);
        expect(userLEthBalance).to.be.lt(userLEthBalanceBefore);
        expect(userLEthBalance).to.be.eq(userLEthBalanceBefore.sub(actualWEthSwapped));
        expect(userWethBalance).to.be.eq(userWethBalanceBefore);
      });

      it('should correctly swap tokens and repay the whole stable debt', async () => {
        const { users, pool, weth, aWETH, oracle, dai, uniswapRepayAdapter, helpersContract } =
          testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await convertToCurrencyDecimals(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const expectedDaiAmount = await convertToCurrencyDecimals(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString()).div(daiPrice.toString()).toFixed(0)
        );

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const daiStableDebtTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).stableDebtTokenAddress;

        const daiStableDebtContract = await getContract<StableDebtToken>(
          eContractid.StableDebtToken,
          daiStableDebtTokenAddress
        );

        const userDaiStableDebtAmountBefore = await daiStableDebtContract.balanceOf(userAddress);

        // Add a % to repay on top of the debt
        const liquidityToSwap = new BigNumber(amountWETHtoSwap.toString())
          .multipliedBy(1.1)
          .toFixed(0);

        await aWETH.connect(user).approve(uniswapRepayAdapter.address, liquidityToSwap);
        const userLEthBalanceBefore = await aWETH.balanceOf(userAddress);

        // Add a % to repay on top of the debt
        const amountToRepay = new BigNumber(expectedDaiAmount.toString())
          .multipliedBy(1.1)
          .toFixed(0);

        await mockUniswapRouter.connect(user).setAmountToSwap(weth.address, amountWETHtoSwap);
        await mockUniswapRouter.setDefaultMockValue(amountWETHtoSwap);

        const params = buildRepayAdapterParams(
          weth.address,
          liquidityToSwap,
          1,
          0,
          0,
          0,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          false
        );

        await pool
          .connect(user)
          .flashLoan(
            uniswapRepayAdapter.address,
            [dai.address],
            [amountToRepay.toString()],
            [0],
            userAddress,
            params,
            0
          );

        const adapterWethBalance = await weth.balanceOf(uniswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(uniswapRepayAdapter.address);
        const userDaiStableDebtAmount = await daiStableDebtContract.balanceOf(userAddress);
        const userLEthBalance = await aWETH.balanceOf(userAddress);
        const adapterLEthBalance = await aWETH.balanceOf(uniswapRepayAdapter.address);

        expect(adapterLEthBalance).to.be.eq(Zero);
        expect(adapterWethBalance).to.be.eq(Zero);
        expect(adapterDaiBalance).to.be.eq(Zero);
        expect(userDaiStableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiStableDebtAmount).to.be.eq(Zero);
        expect(userLEthBalance).to.be.lt(userLEthBalanceBefore);
        expect(userLEthBalance).to.be.gte(userLEthBalanceBefore.sub(liquidityToSwap));
      });

      it('should correctly swap tokens and repay the whole variable debt', async () => {
        const { users, pool, weth, aWETH, oracle, dai, uniswapRepayAdapter, helpersContract } =
          testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await convertToCurrencyDecimals(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const expectedDaiAmount = await convertToCurrencyDecimals(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString()).div(daiPrice.toString()).toFixed(0)
        );

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 2, 0, userAddress);

        const daiStableVariableTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).variableDebtTokenAddress;

        const daiVariableDebtContract = await getContract<StableDebtToken>(
          eContractid.VariableDebtToken,
          daiStableVariableTokenAddress
        );

        const userDaiVariableDebtAmountBefore = await daiVariableDebtContract.balanceOf(
          userAddress
        );

        // Add a % to repay on top of the debt
        const liquidityToSwap = new BigNumber(amountWETHtoSwap.toString())
          .multipliedBy(1.1)
          .toFixed(0);

        await aWETH.connect(user).approve(uniswapRepayAdapter.address, liquidityToSwap);
        const userLEthBalanceBefore = await aWETH.balanceOf(userAddress);

        // Add a % to repay on top of the debt
        const amountToRepay = new BigNumber(expectedDaiAmount.toString())
          .multipliedBy(1.1)
          .toFixed(0);

        await mockUniswapRouter.connect(user).setAmountToSwap(weth.address, amountWETHtoSwap);
        await mockUniswapRouter.setDefaultMockValue(amountWETHtoSwap);

        const params = buildRepayAdapterParams(
          weth.address,
          liquidityToSwap,
          2,
          0,
          0,
          0,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          false
        );

        await pool
          .connect(user)
          .flashLoan(
            uniswapRepayAdapter.address,
            [dai.address],
            [amountToRepay.toString()],
            [0],
            userAddress,
            params,
            0
          );

        const adapterWethBalance = await weth.balanceOf(uniswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(uniswapRepayAdapter.address);
        const userDaiVariableDebtAmount = await daiVariableDebtContract.balanceOf(userAddress);
        const userLEthBalance = await aWETH.balanceOf(userAddress);
        const adapterLEthBalance = await aWETH.balanceOf(uniswapRepayAdapter.address);

        expect(adapterLEthBalance).to.be.eq(Zero);
        expect(adapterWethBalance).to.be.eq(Zero);
        expect(adapterDaiBalance).to.be.eq(Zero);
        expect(userDaiVariableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiVariableDebtAmount).to.be.eq(Zero);
        expect(userLEthBalance).to.be.lt(userLEthBalanceBefore);
        expect(userLEthBalance).to.be.gte(userLEthBalanceBefore.sub(liquidityToSwap));
      });

      it('should correctly repay debt via flash loan using the same asset as collateral', async () => {
        const { users, pool, lDai, dai, uniswapRepayAdapter, helpersContract } = testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        // Add deposit for user
        await dai.mint(parseEther('30'));
        await dai.approve(pool.address, parseEther('30'));
        await pool.deposit(dai.address, parseEther('30'), userAddress, 0);

        const amountCollateralToSwap = parseEther('10');
        const debtAmount = parseEther('10');

        // Open user Debt
        await pool.connect(user).borrow(dai.address, debtAmount, 2, 0, userAddress);

        const daiVariableDebtTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).variableDebtTokenAddress;

        const daiVariableDebtContract = await getContract<VariableDebtToken>(
          eContractid.VariableDebtToken,
          daiVariableDebtTokenAddress
        );

        const userDaiVariableDebtAmountBefore = await daiVariableDebtContract.balanceOf(
          userAddress
        );

        const flashLoanDebt = new BigNumber(amountCollateralToSwap.toString())
          .multipliedBy(1.0009)
          .toFixed(0);

        await lDai.connect(user).approve(uniswapRepayAdapter.address, flashLoanDebt);
        const userLDaiBalanceBefore = await lDai.balanceOf(userAddress);
        const userDaiBalanceBefore = await dai.balanceOf(userAddress);

        const params = buildRepayAdapterParams(
          dai.address,
          amountCollateralToSwap,
          2,
          0,
          0,
          0,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          false
        );

        await pool
          .connect(user)
          .flashLoan(
            uniswapRepayAdapter.address,
            [dai.address],
            [amountCollateralToSwap.toString()],
            [0],
            userAddress,
            params,
            0
          );

        const adapterDaiBalance = await dai.balanceOf(uniswapRepayAdapter.address);
        const userDaiVariableDebtAmount = await daiVariableDebtContract.balanceOf(userAddress);
        const userLDaiBalance = await lDai.balanceOf(userAddress);
        const adapterLDaiBalance = await lDai.balanceOf(uniswapRepayAdapter.address);
        const userDaiBalance = await dai.balanceOf(userAddress);

        expect(adapterLDaiBalance).to.be.eq(Zero, 'adapter lDai balance should be zero');
        expect(adapterDaiBalance).to.be.eq(Zero, 'adapter DAI balance should be zero');
        expect(userDaiVariableDebtAmountBefore).to.be.gte(
          debtAmount,
          ' user DAI variable debt before should be gte debtAmount'
        );
        expect(userDaiVariableDebtAmount).to.be.lt(
          debtAmount,
          'user dai variable debt amount should be lt debt amount'
        );
        expect(userLDaiBalance).to.be.lt(
          userLDaiBalanceBefore,
          'user lDai balance should be lt lDai prior balance'
        );
        expect(userLDaiBalance).to.be.gte(
          userLDaiBalanceBefore.sub(flashLoanDebt),
          'user lDai balance should be gte lDai prior balance sub flash loan debt'
        );
        expect(userDaiBalance).to.be.eq(userDaiBalanceBefore, 'user dai balance eq prior balance');
      });
    });

    describe('swapAndRepay', () => {
      it('should correctly swap tokens and repay debt', async () => {
        const { users, pool, weth, aWETH, oracle, dai, uniswapRepayAdapter, helpersContract } =
          testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await convertToCurrencyDecimals(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const expectedDaiAmount = await convertToCurrencyDecimals(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString()).div(daiPrice.toString()).toFixed(0)
        );

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const daiStableDebtTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).stableDebtTokenAddress;

        const daiStableDebtContract = await getContract<StableDebtToken>(
          eContractid.StableDebtToken,
          daiStableDebtTokenAddress
        );

        const userDaiStableDebtAmountBefore = await daiStableDebtContract.balanceOf(userAddress);

        const liquidityToSwap = amountWETHtoSwap;
        await aWETH.connect(user).approve(uniswapRepayAdapter.address, liquidityToSwap);
        const userLEthBalanceBefore = await aWETH.balanceOf(userAddress);

        await mockUniswapRouter.setAmountToSwap(weth.address, liquidityToSwap);

        await mockUniswapRouter.setDefaultMockValue(liquidityToSwap);

        await uniswapRepayAdapter.connect(user).swapAndRepay(
          weth.address,
          dai.address,
          liquidityToSwap,
          expectedDaiAmount,
          1,
          {
            amount: 0,
            deadline: 0,
            v: 0,
            r: '0x0000000000000000000000000000000000000000000000000000000000000000',
            s: '0x0000000000000000000000000000000000000000000000000000000000000000',
          },
          false
        );

        const adapterWethBalance = await weth.balanceOf(uniswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(uniswapRepayAdapter.address);
        const userDaiStableDebtAmount = await daiStableDebtContract.balanceOf(userAddress);
        const userLEthBalance = await aWETH.balanceOf(userAddress);

        expect(adapterWethBalance).to.be.eq(Zero);
        expect(adapterDaiBalance).to.be.eq(Zero);
        expect(userDaiStableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiStableDebtAmount).to.be.lt(expectedDaiAmount);
        expect(userLEthBalance).to.be.lt(userLEthBalanceBefore);
        expect(userLEthBalance).to.be.gte(userLEthBalanceBefore.sub(liquidityToSwap));
      });

      it('should correctly swap tokens and repay debt with permit', async () => {
        const { users, pool, weth, aWETH, oracle, dai, uniswapRepayAdapter, helpersContract } =
          testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await convertToCurrencyDecimals(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const expectedDaiAmount = await convertToCurrencyDecimals(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString()).div(daiPrice.toString()).toFixed(0)
        );

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const daiStableDebtTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).stableDebtTokenAddress;

        const daiStableDebtContract = await getContract<StableDebtToken>(
          eContractid.StableDebtToken,
          daiStableDebtTokenAddress
        );

        const userDaiStableDebtAmountBefore = await daiStableDebtContract.balanceOf(userAddress);

        const liquidityToSwap = amountWETHtoSwap;
        const userLEthBalanceBefore = await aWETH.balanceOf(userAddress);

        await mockUniswapRouter.setAmountToSwap(weth.address, liquidityToSwap);

        await mockUniswapRouter.setDefaultMockValue(liquidityToSwap);

        const chainId = DRE.network.config.chainId || BUIDLEREVM_CHAINID;
        const deadline = MAX_UINT_AMOUNT;
        const nonce = (await aWETH._nonces(userAddress)).toNumber();
        const msgParams = buildPermitParams(
          chainId,
          aWETH.address,
          '1',
          await aWETH.name(),
          userAddress,
          uniswapRepayAdapter.address,
          nonce,
          deadline,
          liquidityToSwap.toString()
        );

        const ownerPrivateKey = require('../../test-wallets.js').accounts[1].secretKey;
        if (!ownerPrivateKey) {
          throw new Error('INVALID_OWNER_PK');
        }

        const { v, r, s } = getSignatureFromTypedData(ownerPrivateKey, msgParams);

        await uniswapRepayAdapter.connect(user).swapAndRepay(
          weth.address,
          dai.address,
          liquidityToSwap,
          expectedDaiAmount,
          1,
          {
            amount: liquidityToSwap,
            deadline,
            v,
            r,
            s,
          },
          false
        );

        const adapterWethBalance = await weth.balanceOf(uniswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(uniswapRepayAdapter.address);
        const userDaiStableDebtAmount = await daiStableDebtContract.balanceOf(userAddress);
        const userLEthBalance = await aWETH.balanceOf(userAddress);

        expect(adapterWethBalance).to.be.eq(Zero);
        expect(adapterDaiBalance).to.be.eq(Zero);
        expect(userDaiStableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiStableDebtAmount).to.be.lt(expectedDaiAmount);
        expect(userLEthBalance).to.be.lt(userLEthBalanceBefore);
        expect(userLEthBalance).to.be.gte(userLEthBalanceBefore.sub(liquidityToSwap));
      });

      it('should revert if there is not debt to repay', async () => {
        const { users, weth, aWETH, oracle, dai, uniswapRepayAdapter } = testEnv;
        const user = users[0].signer;

        const amountWETHtoSwap = await convertToCurrencyDecimals(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const expectedDaiAmount = await convertToCurrencyDecimals(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString()).div(daiPrice.toString()).toFixed(0)
        );

        const liquidityToSwap = amountWETHtoSwap;
        await aWETH.connect(user).approve(uniswapRepayAdapter.address, liquidityToSwap);

        await mockUniswapRouter.setAmountToSwap(weth.address, liquidityToSwap);

        await mockUniswapRouter.setDefaultMockValue(liquidityToSwap);

        await expect(
          uniswapRepayAdapter.connect(user).swapAndRepay(
            weth.address,
            dai.address,
            liquidityToSwap,
            expectedDaiAmount,
            1,
            {
              amount: 0,
              deadline: 0,
              v: 0,
              r: '0x0000000000000000000000000000000000000000000000000000000000000000',
              s: '0x0000000000000000000000000000000000000000000000000000000000000000',
            },
            false
          )
        ).to.be.reverted;
      });

      it('should revert when max amount allowed to swap is bigger than max slippage', async () => {
        const { users, pool, weth, aWETH, oracle, dai, uniswapRepayAdapter } = testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await convertToCurrencyDecimals(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const expectedDaiAmount = await convertToCurrencyDecimals(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString()).div(daiPrice.toString()).toFixed(0)
        );

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const bigMaxAmountToSwap = amountWETHtoSwap.mul(2);
        await aWETH.connect(user).approve(uniswapRepayAdapter.address, bigMaxAmountToSwap);

        await mockUniswapRouter.connect(user).setAmountToSwap(weth.address, bigMaxAmountToSwap);

        await mockUniswapRouter.setDefaultMockValue(bigMaxAmountToSwap);

        await expect(
          uniswapRepayAdapter.connect(user).swapAndRepay(
            weth.address,
            dai.address,
            bigMaxAmountToSwap,
            expectedDaiAmount,
            1,
            {
              amount: 0,
              deadline: 0,
              v: 0,
              r: '0x0000000000000000000000000000000000000000000000000000000000000000',
              s: '0x0000000000000000000000000000000000000000000000000000000000000000',
            },
            false
          )
        ).to.be.revertedWith('maxAmountToSwap exceed max slippage');
      });

      it('should swap, repay debt and pull the needed LTokens leaving no leftovers', async () => {
        const { users, pool, weth, aWETH, oracle, dai, uniswapRepayAdapter, helpersContract } =
          testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await convertToCurrencyDecimals(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const expectedDaiAmount = await convertToCurrencyDecimals(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString()).div(daiPrice.toString()).toFixed(0)
        );

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const daiStableDebtTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).stableDebtTokenAddress;

        const daiStableDebtContract = await getContract<StableDebtToken>(
          eContractid.StableDebtToken,
          daiStableDebtTokenAddress
        );

        const userDaiStableDebtAmountBefore = await daiStableDebtContract.balanceOf(userAddress);

        const liquidityToSwap = amountWETHtoSwap;
        await aWETH.connect(user).approve(uniswapRepayAdapter.address, liquidityToSwap);
        const userLEthBalanceBefore = await aWETH.balanceOf(userAddress);
        const userWethBalanceBefore = await weth.balanceOf(userAddress);

        const actualWEthSwapped = new BigNumber(liquidityToSwap.toString())
          .multipliedBy(0.995)
          .toFixed(0);

        await mockUniswapRouter.connect(user).setAmountToSwap(weth.address, actualWEthSwapped);

        await mockUniswapRouter.setDefaultMockValue(actualWEthSwapped);

        await uniswapRepayAdapter.connect(user).swapAndRepay(
          weth.address,
          dai.address,
          liquidityToSwap,
          expectedDaiAmount,
          1,
          {
            amount: 0,
            deadline: 0,
            v: 0,
            r: '0x0000000000000000000000000000000000000000000000000000000000000000',
            s: '0x0000000000000000000000000000000000000000000000000000000000000000',
          },
          false
        );

        const adapterWethBalance = await weth.balanceOf(uniswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(uniswapRepayAdapter.address);
        const userDaiStableDebtAmount = await daiStableDebtContract.balanceOf(userAddress);
        const userLEthBalance = await aWETH.balanceOf(userAddress);
        const adapterLEthBalance = await aWETH.balanceOf(uniswapRepayAdapter.address);
        const userWethBalance = await weth.balanceOf(userAddress);

        expect(adapterLEthBalance).to.be.eq(Zero);
        expect(adapterWethBalance).to.be.eq(Zero);
        expect(adapterDaiBalance).to.be.eq(Zero);
        expect(userDaiStableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiStableDebtAmount).to.be.lt(expectedDaiAmount);
        expect(userLEthBalance).to.be.lt(userLEthBalanceBefore);
        expect(userLEthBalance).to.be.eq(userLEthBalanceBefore.sub(actualWEthSwapped));
        expect(userWethBalance).to.be.eq(userWethBalanceBefore);
      });

      it('should correctly swap tokens and repay the whole stable debt', async () => {
        const { users, pool, weth, aWETH, oracle, dai, uniswapRepayAdapter, helpersContract } =
          testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await convertToCurrencyDecimals(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const expectedDaiAmount = await convertToCurrencyDecimals(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString()).div(daiPrice.toString()).toFixed(0)
        );

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 1, 0, userAddress);

        const daiStableDebtTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).stableDebtTokenAddress;

        const daiStableDebtContract = await getContract<StableDebtToken>(
          eContractid.StableDebtToken,
          daiStableDebtTokenAddress
        );

        const userDaiStableDebtAmountBefore = await daiStableDebtContract.balanceOf(userAddress);

        // Add a % to repay on top of the debt
        const liquidityToSwap = new BigNumber(amountWETHtoSwap.toString())
          .multipliedBy(1.1)
          .toFixed(0);

        await aWETH.connect(user).approve(uniswapRepayAdapter.address, liquidityToSwap);
        const userLEthBalanceBefore = await aWETH.balanceOf(userAddress);

        // Add a % to repay on top of the debt
        const amountToRepay = new BigNumber(expectedDaiAmount.toString())
          .multipliedBy(1.1)
          .toFixed(0);

        await mockUniswapRouter.connect(user).setAmountToSwap(weth.address, amountWETHtoSwap);
        await mockUniswapRouter.setDefaultMockValue(amountWETHtoSwap);

        await uniswapRepayAdapter.connect(user).swapAndRepay(
          weth.address,
          dai.address,
          liquidityToSwap,
          amountToRepay,
          1,
          {
            amount: 0,
            deadline: 0,
            v: 0,
            r: '0x0000000000000000000000000000000000000000000000000000000000000000',
            s: '0x0000000000000000000000000000000000000000000000000000000000000000',
          },
          false
        );

        const adapterWethBalance = await weth.balanceOf(uniswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(uniswapRepayAdapter.address);
        const userDaiStableDebtAmount = await daiStableDebtContract.balanceOf(userAddress);
        const userLEthBalance = await aWETH.balanceOf(userAddress);
        const adapterLEthBalance = await aWETH.balanceOf(uniswapRepayAdapter.address);

        expect(adapterLEthBalance).to.be.eq(Zero);
        expect(adapterWethBalance).to.be.eq(Zero);
        expect(adapterDaiBalance).to.be.eq(Zero);
        expect(userDaiStableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiStableDebtAmount).to.be.eq(Zero);
        expect(userLEthBalance).to.be.lt(userLEthBalanceBefore);
        expect(userLEthBalance).to.be.gte(userLEthBalanceBefore.sub(liquidityToSwap));
      });

      it('should correctly swap tokens and repay the whole variable debt', async () => {
        const { users, pool, weth, aWETH, oracle, dai, uniswapRepayAdapter, helpersContract } =
          testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        const amountWETHtoSwap = await convertToCurrencyDecimals(weth.address, '10');

        const daiPrice = await oracle.getAssetPrice(dai.address);
        const expectedDaiAmount = await convertToCurrencyDecimals(
          dai.address,
          new BigNumber(amountWETHtoSwap.toString()).div(daiPrice.toString()).toFixed(0)
        );

        // Open user Debt
        await pool.connect(user).borrow(dai.address, expectedDaiAmount, 2, 0, userAddress);

        const daiStableVariableTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).variableDebtTokenAddress;

        const daiVariableDebtContract = await getContract<StableDebtToken>(
          eContractid.VariableDebtToken,
          daiStableVariableTokenAddress
        );

        const userDaiVariableDebtAmountBefore = await daiVariableDebtContract.balanceOf(
          userAddress
        );

        // Add a % to repay on top of the debt
        const liquidityToSwap = new BigNumber(amountWETHtoSwap.toString())
          .multipliedBy(1.1)
          .toFixed(0);

        await aWETH.connect(user).approve(uniswapRepayAdapter.address, liquidityToSwap);
        const userLEthBalanceBefore = await aWETH.balanceOf(userAddress);

        // Add a % to repay on top of the debt
        const amountToRepay = new BigNumber(expectedDaiAmount.toString())
          .multipliedBy(1.1)
          .toFixed(0);

        await mockUniswapRouter.connect(user).setAmountToSwap(weth.address, amountWETHtoSwap);
        await mockUniswapRouter.setDefaultMockValue(amountWETHtoSwap);

        await uniswapRepayAdapter.connect(user).swapAndRepay(
          weth.address,
          dai.address,
          liquidityToSwap,
          amountToRepay,
          2,
          {
            amount: 0,
            deadline: 0,
            v: 0,
            r: '0x0000000000000000000000000000000000000000000000000000000000000000',
            s: '0x0000000000000000000000000000000000000000000000000000000000000000',
          },
          false
        );

        const adapterWethBalance = await weth.balanceOf(uniswapRepayAdapter.address);
        const adapterDaiBalance = await dai.balanceOf(uniswapRepayAdapter.address);
        const userDaiVariableDebtAmount = await daiVariableDebtContract.balanceOf(userAddress);
        const userLEthBalance = await aWETH.balanceOf(userAddress);
        const adapterLEthBalance = await aWETH.balanceOf(uniswapRepayAdapter.address);

        expect(adapterLEthBalance).to.be.eq(Zero);
        expect(adapterWethBalance).to.be.eq(Zero);
        expect(adapterDaiBalance).to.be.eq(Zero);
        expect(userDaiVariableDebtAmountBefore).to.be.gte(expectedDaiAmount);
        expect(userDaiVariableDebtAmount).to.be.eq(Zero);
        expect(userLEthBalance).to.be.lt(userLEthBalanceBefore);
        expect(userLEthBalance).to.be.gte(userLEthBalanceBefore.sub(liquidityToSwap));
      });

      it('should correctly repay debt using the same asset as collateral', async () => {
        const { users, pool, dai, uniswapRepayAdapter, helpersContract, lDai } = testEnv;
        const user = users[0].signer;
        const userAddress = users[0].address;

        // Add deposit for user
        await dai.mint(parseEther('30'));
        await dai.approve(pool.address, parseEther('30'));
        await pool.deposit(dai.address, parseEther('30'), userAddress, 0);

        const amountCollateralToSwap = parseEther('4');

        const debtAmount = parseEther('3');

        // Open user Debt
        await pool.connect(user).borrow(dai.address, debtAmount, 2, 0, userAddress);

        const daiVariableDebtTokenAddress = (
          await helpersContract.getReserveTokensAddresses(dai.address)
        ).variableDebtTokenAddress;

        const daiVariableDebtContract = await getContract<StableDebtToken>(
          eContractid.StableDebtToken,
          daiVariableDebtTokenAddress
        );

        const userDaiVariableDebtAmountBefore = await daiVariableDebtContract.balanceOf(
          userAddress
        );

        await lDai.connect(user).approve(uniswapRepayAdapter.address, amountCollateralToSwap);
        const userLDaiBalanceBefore = await lDai.balanceOf(userAddress);
        const userDaiBalanceBefore = await dai.balanceOf(userAddress);

        await uniswapRepayAdapter.connect(user).swapAndRepay(
          dai.address,
          dai.address,
          amountCollateralToSwap,
          amountCollateralToSwap,
          2,
          {
            amount: 0,
            deadline: 0,
            v: 0,
            r: '0x0000000000000000000000000000000000000000000000000000000000000000',
            s: '0x0000000000000000000000000000000000000000000000000000000000000000',
          },
          false
        );

        const adapterDaiBalance = await dai.balanceOf(uniswapRepayAdapter.address);
        const userDaiVariableDebtAmount = await daiVariableDebtContract.balanceOf(userAddress);
        const userLDaiBalance = await lDai.balanceOf(userAddress);
        const adapterLDaiBalance = await lDai.balanceOf(uniswapRepayAdapter.address);
        const userDaiBalance = await dai.balanceOf(userAddress);

        expect(adapterLDaiBalance).to.be.eq(Zero, 'adapter aLDAI should be zero');
        expect(adapterDaiBalance).to.be.eq(Zero, 'adapter DAI should be zero');
        expect(userDaiVariableDebtAmountBefore).to.be.gte(
          debtAmount,
          'user dai variable debt before should be gte debtAmount'
        );
        expect(userDaiVariableDebtAmount).to.be.lt(
          debtAmount,
          'current user dai variable debt amount should be less than debtAmount'
        );
        expect(userLDaiBalance).to.be.lt(
          userLDaiBalanceBefore,
          'current user lDai balance should be less than prior balance'
        );
        expect(userLDaiBalance).to.be.gte(
          userLDaiBalanceBefore.sub(amountCollateralToSwap),
          'current user lDai balance should be gte user balance sub swapped collateral'
        );
        expect(userDaiBalance).to.be.eq(
          userDaiBalanceBefore,
          'user DAI balance should remain equal'
        );
      });
    });
  });
});
