import { eAstarNetwork, IAstarConfiguration } from '../../helpers/types';
import { CommonsConfig } from './commons';
import {
  strategyARSW,
  strategyUSDC,
  strategyUSDT,
  strategyVEIN,
  strategyWBTC,
  strategyWETH,
  strategyWSBY,
  strategyWSDN
} from './reservesConfigs';

// ----------------
// POOL--SPECIFIC PARAMS
// ----------------

export const AstarConfig: IAstarConfiguration = {
  ...CommonsConfig,
  MarketId: 'Astar market',
  ProviderId: 4,
  ReservesConfig: {
    WSBY: strategyWSBY,
    WETH: strategyWETH,
    WBTC: strategyWBTC,
    WSDN: strategyWSDN,
    USDT: strategyUSDT,
    USDC: strategyUSDC,
    ARSW: strategyARSW,
    VEIN: strategyVEIN,
  },
  ReserveAssets: {
    [eAstarNetwork.shibuya]: {
      // deployed through dev:migration
      WSBY: '0x7ECA847c7F0820fB03B99B69985bb374bb5c543B',
      WETH: '0xE8d8Befa356e690c6Ee4Df018eB2b54FB03E3702',
      WBTC: '0xD5902b1A68566098FF63c6Ac687716391035B433',
      WSDN: '0x325332C8a3bb6D5F46515fc4668a4C8750Db2BC5',
      USDT: '0x062C47783A4e332Be84E89a5fdF5af42F27629E7',
      USDC: '0xf3bE20Fa1665ceE47B6A68007e635716e41d99a7',
      ARSW: '0x67B94331709957C6D5c18FFEc354C303C61f5e63',
      VEIN: '0x2EE6a5FA5d3aC2b6B9A7bb5D34b8CED114d1e332',
    },
  },
};

export default AstarConfig;
