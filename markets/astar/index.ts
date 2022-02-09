import { eAstarNetwork, IAstarConfiguration } from '../../helpers/types';
import { CommonsConfig } from './commons';
import {
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
  },
  ReserveAssets: {
    [eAstarNetwork.shibuya]: {
      // deployed through dev:migration
      WASTR: '',
      WETH: '0xE8d8Befa356e690c6Ee4Df018eB2b54FB03E3702',
      WBTC: '0xD5902b1A68566098FF63c6Ac687716391035B433',
      WSDN: '0x325332C8a3bb6D5F46515fc4668a4C8750Db2BC5',
      USDT: '0x062C47783A4e332Be84E89a5fdF5af42F27629E7',
      USDC: '0xf3bE20Fa1665ceE47B6A68007e635716e41d99a7',
    },
  },
};

export default AstarConfig;
