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
      WASTR: '0x8Fd43fea01125EcA2bEb0bB03509946ECA99eEf9',
      WSDN: '0xc3E70D9eebE0F8c1b62b92a7E5EDC6dcAFF0D07A',
      WETH: '0xaCC0eD47418d0fe33975099142471f8ae43489fa',
      WBTC: '0xe1bCF509f1DbCCD275138C9A6a9b6604E96f1876',
      USDT: '0x8aDa54F1169969119078E23C4Ec632D01bDa329b',
      USDC: '0xB56df4fA49847e7B659B5ed4A133512635fF2577',
      LAY: '0xEB741C051E474f83cff38B44A912281772C23CE6',
    },
    [eAstarNetwork.shiden]: {
      WASTR: '',
      WSDN: '',
      WETH: '',
      WBTC: '',
      USDT: '',
      USDC: '',
      LAY: '0xb163716cb6c8b0a56e4f57c394A50F173E34181b',
    },
  },
};

export default StarlayConfig;
