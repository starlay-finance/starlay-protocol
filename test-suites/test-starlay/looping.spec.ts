import BigNumber from 'bignumber.js';
import { parseEther } from 'ethers/lib/utils';
import { APPROVAL_AMOUNT_LENDING_POOL, oneEther } from '../../helpers/constants';
import { convertToCurrencyDecimals } from '../../helpers/contracts-helpers';
import { DRE, increaseTime } from '../../helpers/misc-utils';
import { ProtocolErrors, RateMode } from '../../helpers/types';
import { makeSuite } from './helpers/make-suite';
import { calcExpectedStableDebtTokenBalance } from './helpers/utils/calculations';
import { getUserData } from './helpers/utils/helpers';

const chai = require('chai');

const { expect } = chai;

makeSuite('LendingPool liquidation - liquidator receiving the underlying asset', (testEnv) => {
  const { INVALID_HF } = ProtocolErrors;

  before('Before LendingPool liquidation: set config', () => {
    BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: BigNumber.ROUND_DOWN });
  });

  after('After LendingPool liquidation: reset config', () => {
    BigNumber.config({ DECIMAL_PLACES: 20, ROUNDING_MODE: BigNumber.ROUND_HALF_UP });
  });

  it('looping', async () => {
    const { usdc, users, pool, leverager, oracle, weth, vdUsdc, helpersContract } = testEnv;

    const depositor = users[3];
    // const leverager = users[4];
    const initialDeposit = new BigNumber('100');
    const ratio = 0.8;
    const count = 20;

    //mints USDC to depositor
    await usdc.connect(depositor.signer).mint(await convertToCurrencyDecimals(usdc.address, '100'));

    //approve protocol to access depositor wallet
    await usdc.connect(depositor.signer).approve(leverager.address, APPROVAL_AMOUNT_LENDING_POOL);
    await usdc.connect(leverager.signer).approve(pool.address, APPROVAL_AMOUNT_LENDING_POOL);

    //approve leverager to use depositor credit
    await vdUsdc
      .connect(depositor.signer)
      .approveDelegation(leverager.address, APPROVAL_AMOUNT_LENDING_POOL);

    const amountUSDCtoDeposit = await convertToCurrencyDecimals(
      usdc.address,
      initialDeposit.toFixed(6)
    );
    await leverager
      .connect(depositor.signer)
      .loop(usdc.address, amountUSDCtoDeposit, 2, ratio * 10000, count);
    // let nextDeposit = initialDeposit

    // for (let i=1; i<= count;i++) {

    //   //depositor deposits 1000 USDC
    //   const amountUSDCtoDeposit = await convertToCurrencyDecimals(usdc.address,nextDeposit.toFixed(6));

    //   await pool
    //   .connect(leverager.signer)
    //   .deposit(usdc.address, amountUSDCtoDeposit, depositor.address, '0');

    //   //borrower borrows
    //   const amountUSDCToBorrow = await convertToCurrencyDecimals(
    //     usdc.address,
    //     nextDeposit.multipliedBy(ratio).toFixed(6)
    //     );

    //     await pool
    //     .connect(leverager.signer)
    //     .borrow(usdc.address, amountUSDCToBorrow, RateMode.Variable, '0', depositor.address);
    //     nextDeposit = nextDeposit.multipliedBy(ratio)
    //     console.log(i, amountUSDCtoDeposit.toString(), amountUSDCToBorrow.toString())
    //   }

    const userReserveDataAfter = await helpersContract.getUserReserveData(
      usdc.address,
      depositor.address
    );

    const userGlobalDataAfter = await pool.getUserAccountData(depositor.address);

    const usdcReserveDataAfter = await helpersContract.getReserveData(usdc.address);
    const ethReserveDataAfter = await helpersContract.getReserveData(weth.address);

    const collateralPrice = await oracle.getAssetPrice(weth.address);
    const principalPrice = await oracle.getAssetPrice(usdc.address);

    const collateralDecimals = (
      await helpersContract.getReserveConfigurationData(weth.address)
    ).decimals.toString();
    const principalDecimals = (
      await helpersContract.getReserveConfigurationData(usdc.address)
    ).decimals.toString();

    expect(userReserveDataAfter.currentLTokenBalance).to.be.equal('500');
    expect(userReserveDataAfter.currentVariableDebt).to.be.equal('400');
  });
});
