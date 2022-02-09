import { eAstarNetwork, IAstarConfiguration } from '../../helpers/types';
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

export const AstarConfig: IAstarConfiguration = {
  ...CommonsConfig,
  MarketId: 'Astar market',
  ProviderId: 4,
  ReservesConfig: {
    WASTR: strategyWASTR,
    WETH: strategyWETH,
    WBTC: strategyWBTC,
    WSDN: strategyWSDN,
    USDT: strategyUSDT,
    USDC: strategyUSDC,
    LAY: strategyLAY,
  },
  ReserveAssets: {
    [eAstarNetwork.shibuya]: {
      WASTR: '0x674421E9567653EE76e96fEEA3B2B2966d000Dbd',
      WETH: '0x04efa209F9e74E612a529c393Cf9F1141E696F06',
      WBTC: '0x2025efC28f85c717df189916344ECa168AAD0667', //tmp
      WSDN: '0xB9F3803304b582fCd852365aD75192FEA089D49F',
      USDT: '0x3f815e7d299f08278c0308aE1048aa45ED12415f', // tmp
      USDC: '0xA4F42578c723A5B6781A9F49d586B8645ba85C31',
      LAY: '0x1302f8D1e37B8b83C7c3eB3b02E0e7eEAc28929f', //tmp
    },
  },
};

export default AstarConfig;
