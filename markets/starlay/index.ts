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
      WASTR: '0x44a26AE046a01d99eBAbecc24B4d61B388656871',
      WSDN: '0x7cA69766F4be8Ec93dD01E1d571e64b867455e58',
      WETH: '0x72fE832eB0452285e91CA9F46B85229A5107CeE8',
      WBTC: '0xEdAA9f408ac11339766a4E5e0d4653BDee52fcA1',
      USDT: '0xdB25FDCCe3E63B376D308dC2D46234632d9959d8',
      USDC: '0x458db3bEf6ffC5212f9359bbDAeD0D5A58129397',
      LAY: '0xb163716cb6c8b0a56e4f57c394A50F173E34181b',
    },
  },
};

export default StarlayConfig;
