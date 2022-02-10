import { eAstarNetwork, eEthereumNetwork, IStarlayConfiguration } from '../../helpers/types';
import { CommonsConfig } from './commons';
import {
  strategyLAY,
  strategyUSDC,
  strategyUSDT,
  strategyWASTR,
  strategyWBTC,
  strategyWETH,
  strategyWSDN,
} from './reservesConfigs';

// ----------------
// POOL--SPECIFIC PARAMS
// ----------------

export const StarlayConfig: IStarlayConfiguration = {
  ...CommonsConfig,
  MarketId: 'Starlay genesis market',
  ProviderId: 1,
  ReservesConfig: {
    LAY: strategyLAY,
    USDC: strategyUSDC,
    USDT: strategyUSDT,
    WBTC: strategyWBTC,
    WETH: strategyWETH,
    WASTR: strategyWASTR,
    WSDN: strategyWSDN,
  },
  ReserveAssets: {
    [eEthereumNetwork.buidlerevm]: {},
    [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.coverage]: {},
    [eEthereumNetwork.tenderly]: {},
    [eAstarNetwork.shibuya]: {
      WASTR: '0x674421E9567653EE76e96fEEA3B2B2966d000Dbd',
      WSDN: '0xB9F3803304b582fCd852365aD75192FEA089D49F',
      WETH: '0x04efa209F9e74E612a529c393Cf9F1141E696F06',
      WBTC: '0x2025efC28f85c717df189916344ECa168AAD0667', //tmp
      USDT: '0x3f815e7d299f08278c0308aE1048aa45ED12415f', // tmp
      USDC: '0xA4F42578c723A5B6781A9F49d586B8645ba85C31',
      LAY: '0x1302f8D1e37B8b83C7c3eB3b02E0e7eEAc28929f', //tmp
    },
  },
};

export default StarlayConfig;
