import { eEthereumNetwork, IStarlayConfiguration } from '../../helpers/types';
import { CommonsConfig } from './commons';
import {
  strategyAAVE,
  strategyDAI,
  strategyLINK,
  strategyMKR,
  strategyUSDC,
  strategyUSDT,
  strategyWBTC,
  strategyWETH,
} from './reservesConfigs';

// ----------------
// POOL--SPECIFIC PARAMS
// ----------------

export const StarlayConfig: IStarlayConfiguration = {
  ...CommonsConfig,
  MarketId: 'Starlay genesis market',
  ProviderId: 1,
  ReservesConfig: {
    AAVE: strategyAAVE,
    DAI: strategyDAI,
    LINK: strategyLINK,
    MKR: strategyMKR,
    USDC: strategyUSDC,
    USDT: strategyUSDT,
    WBTC: strategyWBTC,
    WETH: strategyWETH,
  },
  ReserveAssets: {
    [eEthereumNetwork.buidlerevm]: {},
    [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.coverage]: {},
    [eEthereumNetwork.kovan]: {
      AAVE: '0xB597cd8D3217ea6477232F9217fa70837ff667Af',
      DAI: '0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD',
      LINK: '0xAD5ce863aE3E4E9394Ab43d4ba0D80f419F61789',
      MKR: '0x61e4CAE3DA7FD189e52a4879C7B8067D7C2Cc0FA',
      USDC: '0xe22da380ee6B445bb8273C81944ADEB6E8450422',
      USDT: '0x13512979ADE267AB5100878E2e0f485B568328a4',
      WBTC: '0xD1B98B6607330172f1D991521145A22BCe793277',
      WETH: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
    },
    [eEthereumNetwork.main]: {
      AAVE: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
      DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      MKR: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
      USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    },
    [eEthereumNetwork.tenderly]: {
      AAVE: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
      DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      MKR: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
      USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    },
  },
};

export default StarlayConfig;
