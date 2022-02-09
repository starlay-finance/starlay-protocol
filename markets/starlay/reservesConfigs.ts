import { eContractid, IReserveParams } from '../../helpers/types';
import {
  rateStrategyLAY,
  rateStrategyStableThree,
  rateStrategyStableTwo,
  rateStrategyVolatileTwo,
  rateStrategyWETH,
} from './rateStrategies';

export const strategyDAI: IReserveParams = {
  strategy: rateStrategyStableTwo,
  baseLTVAsCollateral: '7500',
  liquidationThreshold: '8000',
  liquidationBonus: '10500',
  borrowingEnabled: true,
  stableBorrowRateEnabled: true,
  reserveDecimals: '18',
  lTokenImpl: eContractid.LToken,
  reserveFactor: '1000',
};

export const strategyUSDC: IReserveParams = {
  strategy: rateStrategyStableThree,
  baseLTVAsCollateral: '8000',
  liquidationThreshold: '8500',
  liquidationBonus: '10500',
  borrowingEnabled: true,
  stableBorrowRateEnabled: true,
  reserveDecimals: '6',
  lTokenImpl: eContractid.LToken,
  reserveFactor: '1000',
};

export const strategyUSDT: IReserveParams = {
  strategy: rateStrategyStableThree,
  baseLTVAsCollateral: '0',
  liquidationThreshold: '0',
  liquidationBonus: '0',
  borrowingEnabled: true,
  stableBorrowRateEnabled: true,
  reserveDecimals: '6',
  lTokenImpl: eContractid.LToken,
  reserveFactor: '1000',
};

// TODO: setting
export const strategyLAY: IReserveParams = {
  strategy: rateStrategyLAY,
  baseLTVAsCollateral: '5000',
  liquidationThreshold: '6500',
  liquidationBonus: '11000',
  borrowingEnabled: false,
  stableBorrowRateEnabled: false,
  reserveDecimals: '18',
  lTokenImpl: eContractid.LToken,
  reserveFactor: '0',
};

export const strategyWETH: IReserveParams = {
  strategy: rateStrategyWETH,
  baseLTVAsCollateral: '8000',
  liquidationThreshold: '8250',
  liquidationBonus: '10500',
  borrowingEnabled: true,
  stableBorrowRateEnabled: true,
  reserveDecimals: '18',
  lTokenImpl: eContractid.LToken,
  reserveFactor: '1000',
};

export const strategyWBTC: IReserveParams = {
  strategy: rateStrategyVolatileTwo,
  baseLTVAsCollateral: '7000',
  liquidationThreshold: '7500',
  liquidationBonus: '11000',
  borrowingEnabled: true,
  stableBorrowRateEnabled: true,
  reserveDecimals: '8',
  lTokenImpl: eContractid.LToken,
  reserveFactor: '2000',
};
