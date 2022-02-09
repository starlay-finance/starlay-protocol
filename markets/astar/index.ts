import { ZERO_ADDRESS } from '../../helpers/constants';
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
    LAY: strategyLAY,
    WASTR: strategyWASTR,
    WETH: strategyWETH,
    WBTC: strategyWBTC,
    WSDN: strategyWSDN,
    USDT: strategyUSDT,
    USDC: strategyUSDC,
  },
  ReserveAssets: {
    [eAstarNetwork.shibuya]: {
      WASTR: ZERO_ADDRESS,
      WETH: ZERO_ADDRESS,
      WBTC: ZERO_ADDRESS,
      WSDN: ZERO_ADDRESS,
      USDT: ZERO_ADDRESS,
      USDC: ZERO_ADDRESS,
      LAY: ZERO_ADDRESS,
    },
  },
};

export default AstarConfig;
