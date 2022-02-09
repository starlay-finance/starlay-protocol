import { eEthereumNetwork, IStarlayConfiguration } from '../../helpers/types';
import { CommonsConfig } from './commons';
import {
  strategyAAVE,
  strategyBAT,
  strategyDAI,
  strategyLINK,
  strategyMKR,
  strategySUSD,
  strategyTUSD,
  strategyUNI,
  strategyUSDC,
  strategyUSDT,
  strategyWBTC,
  strategyWETH,
  strategyZRX,
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
    BAT: strategyBAT,
    DAI: strategyDAI,
    LINK: strategyLINK,
    MKR: strategyMKR,
    SUSD: strategySUSD,
    TUSD: strategyTUSD,
    UNI: strategyUNI,
    USDC: strategyUSDC,
    USDT: strategyUSDT,
    WBTC: strategyWBTC,
    WETH: strategyWETH,
    ZRX: strategyZRX,
  },
  ReserveAssets: {
    [eEthereumNetwork.buidlerevm]: {},
    [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.coverage]: {},
    [eEthereumNetwork.kovan]: {
      AAVE: '0xB597cd8D3217ea6477232F9217fa70837ff667Af',
      BAT: '0x2d12186Fbb9f9a8C28B3FfdD4c42920f8539D738',
      DAI: '0xFf795577d9AC8bD7D90Ee22b6C1703490b6512FD',
      LINK: '0xAD5ce863aE3E4E9394Ab43d4ba0D80f419F61789',
      MKR: '0x61e4CAE3DA7FD189e52a4879C7B8067D7C2Cc0FA',
      SUSD: '0x99b267b9D96616f906D53c26dECf3C5672401282',
      TUSD: '0x016750AC630F711882812f24Dba6c95b9D35856d',
      UNI: '0x075A36BA8846C6B6F53644fDd3bf17E5151789DC',
      USDC: '0xe22da380ee6B445bb8273C81944ADEB6E8450422',
      USDT: '0x13512979ADE267AB5100878E2e0f485B568328a4',
      WBTC: '0xD1B98B6607330172f1D991521145A22BCe793277',
      WETH: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
      ZRX: '0xD0d76886cF8D952ca26177EB7CfDf83bad08C00C',
    },
    [eEthereumNetwork.main]: {
      AAVE: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
      BAT: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
      DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      MKR: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
      SUSD: '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51',
      TUSD: '0x0000000000085d4780B73119b644AE5ecd22b376',
      UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      ZRX: '0xE41d2489571d322189246DaFA5ebDe1F4699F498',
    },
    [eEthereumNetwork.tenderly]: {
      AAVE: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
      BAT: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
      DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      LINK: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      MKR: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
      SUSD: '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51',
      TUSD: '0x0000000000085d4780B73119b644AE5ecd22b376',
      UNI: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      ZRX: '0xE41d2489571d322189246DaFA5ebDe1F4699F498',
    },
  },
};

export default StarlayConfig;
