import {
  MOCK_PRICE_AGGREGATORS_PRICES,
  oneRay,
  oneUsd,
  ZERO_ADDRESS,
} from '../../helpers/constants';
import { eEthereumNetwork, ICommonConfiguration } from '../../helpers/types';
import { eAstarNetwork } from './../../helpers/types';

// ----------------
// PROTOCOL GLOBAL PARAMS
// ----------------

export const CommonsConfig: ICommonConfiguration = {
  MarketId: 'Commons',
  LTokenNamePrefix: 'Starley interest bearing',
  StableDebtTokenNamePrefix: 'Starley stable debt bearing',
  VariableDebtTokenNamePrefix: 'Starley variable debt bearing',
  SymbolPrefix: '',
  ProviderId: 0, // Overriden in index.ts
  OracleQuoteCurrency: 'USD',
  OracleQuoteUnit: oneUsd.toString(),
  ProtocolGlobalParams: {
    TokenDistributorPercentageBase: '10000',
    MockUsdPriceInWei: '5848466240000000',
    UsdAddress: '0x10F7Fc1F91Ba351f9C629c5947AD69bD03C05b96',
    NilAddress: '0x0000000000000000000000000000000000000000',
    OneAddress: '0x0000000000000000000000000000000000000001',
    StarlayReferral: '0',
  },

  // ----------------
  // COMMON PROTOCOL PARAMS ACROSS POOLS AND NETWORKS
  // ----------------

  Mocks: {
    AllAssetsInitialPrices: {
      ...MOCK_PRICE_AGGREGATORS_PRICES,
    },
  },
  LendingRateOracleRatesCommon: {
    WETH: {
      borrowRate: oneRay.multipliedBy(0.03).toFixed(),
    },
    USDC: {
      borrowRate: oneRay.multipliedBy(0.039).toFixed(),
    },
    USDT: {
      borrowRate: oneRay.multipliedBy(0.035).toFixed(),
    },
    LAY: {
      borrowRate: oneRay.multipliedBy(0.03).toFixed(),
    },
    WBTC: {
      borrowRate: oneRay.multipliedBy(0.03).toFixed(),
    },
    WASTR: {
      borrowRate: oneRay.multipliedBy(0.03).toFixed(),
    },
    WSDN: {
      borrowRate: oneRay.multipliedBy(0.03).toFixed(),
    },
  },
  // ----------------
  // COMMON PROTOCOL ADDRESSES ACROSS POOLS
  // ----------------

  // If PoolAdmin/emergencyAdmin is set, will take priority over PoolAdminIndex/emergencyAdminIndex
  PoolAdmin: {
    [eEthereumNetwork.buidlerevm]: undefined,
    [eEthereumNetwork.coverage]: undefined,
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.tenderly]: undefined,
    [eAstarNetwork.shibuya]: undefined,
    [eAstarNetwork.shiden]: undefined,
    [eAstarNetwork.astar]: undefined,
  },
  PoolAdminIndex: 0,
  EmergencyAdmin: {
    [eEthereumNetwork.buidlerevm]: undefined,
    [eEthereumNetwork.coverage]: undefined,
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.tenderly]: undefined,
    [eAstarNetwork.shibuya]: undefined,
    [eAstarNetwork.shiden]: undefined,
    [eAstarNetwork.astar]: undefined,
  },
  EmergencyAdminIndex: 1,
  ProviderRegistry: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.tenderly]: '0x52D306e36E3B6B02c153d0266ff0f85d18BCD413',
    [eAstarNetwork.shibuya]: '',
    [eAstarNetwork.shiden]: '',
    [eAstarNetwork.astar]: '',
  },
  ProviderRegistryOwner: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.tenderly]: '0xB9062896ec3A615a4e4444DF183F0531a77218AE',
    [eAstarNetwork.shibuya]: '',
    [eAstarNetwork.shiden]: '',
    [eAstarNetwork.astar]: '',
  },
  LendingRateOracle: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.tenderly]: '0x8A32f49FFbA88aba6EFF96F45D8BD1D4b3f35c7D',
    [eAstarNetwork.shibuya]: '',
    [eAstarNetwork.shiden]: '',
    [eAstarNetwork.astar]: '',
  },
  LendingPoolCollateralManager: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.tenderly]: '0xbd4765210d4167CE2A5b87280D9E8Ee316D5EC7C',
    [eAstarNetwork.shibuya]: '',
    [eAstarNetwork.shiden]: '',
    [eAstarNetwork.astar]: '',
  },
  LendingPoolConfigurator: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.tenderly]: '',
    [eAstarNetwork.shibuya]: '',
    [eAstarNetwork.shiden]: '',
    [eAstarNetwork.astar]: '',
  },
  LendingPool: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.tenderly]: '',
    [eAstarNetwork.shibuya]: '',
    [eAstarNetwork.shiden]: '',
    [eAstarNetwork.astar]: '',
  },
  WethGateway: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.tenderly]: '',
    [eAstarNetwork.shibuya]: '',
    [eAstarNetwork.shiden]: '',
    [eAstarNetwork.astar]: '',
  },
  TokenDistributor: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.tenderly]: '0xe3d9988f676457123c5fd01297605efdd0cba1ae',
    [eAstarNetwork.shibuya]: '',
    [eAstarNetwork.shiden]: '',
    [eAstarNetwork.astar]: '',
  },
  DIAAggregatorAddress: {
    // https://docs.diadata.org/documentation/oracle-documentation/deployed-contracts#astar-shiden
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.tenderly]: '',
    [eAstarNetwork.shibuya]: '0x1232acd632dd75f874e357c77295da3f5cd7733e',
    [eAstarNetwork.shiden]: '0xb727CD54C33095111eDb4082B4d5c857f99F19Ec', // DIAOracleV2
    [eAstarNetwork.astar]: '', // DIAOracleV2
  },
  PriceAggregator: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.tenderly]: '0xA50ba011c48153De246E5192C8f9258A2ba79Ca9',
    [eAstarNetwork.shibuya]: '',
    [eAstarNetwork.shiden]: '',
    [eAstarNetwork.astar]: '',
  },
  StarlayOracle: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.tenderly]: '',
    [eAstarNetwork.shibuya]: '0x7eCdDacFb4B0dCbD4Eb974934d3EDA29a9A50518',
    [eAstarNetwork.shiden]: '0xe627F5D052A87532D7809b147F215B37B8a2Fb54',
    [eAstarNetwork.astar]: '',
  },
  FallbackOracle: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.tenderly]: ZERO_ADDRESS,
    [eAstarNetwork.shibuya]: '0x0417750Cba71Bc894d31CF7071a1214c612106F2',
    [eAstarNetwork.shiden]: ZERO_ADDRESS,
    [eAstarNetwork.astar]: ZERO_ADDRESS,
  },
  ChainlinkAggregator: {
    [eEthereumNetwork.buidlerevm]: {},
    [eEthereumNetwork.coverage]: {},
    [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.tenderly]: {},
    [eAstarNetwork.shibuya]: {},
    [eAstarNetwork.shiden]: {},
    [eAstarNetwork.astar]: {},
  },
  DIAAggregator: {
    // key: without 'w' to call function of DIA e.g WSDN->SDN
    // ref: https://docs.diadata.org/documentation/oracle-documentation/crypto-assets
    [eEthereumNetwork.buidlerevm]: {},
    [eEthereumNetwork.coverage]: {},
    [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.tenderly]: {},
    [eAstarNetwork.shibuya]: {
      ASTR: '0x8Fd43fea01125EcA2bEb0bB03509946ECA99eEf9',
      SDN: '0xc3E70D9eebE0F8c1b62b92a7E5EDC6dcAFF0D07A',
      ETH: '0xaCC0eD47418d0fe33975099142471f8ae43489fa',
      BTC: '0xe1bCF509f1DbCCD275138C9A6a9b6604E96f1876',
      USDT: '0x8aDa54F1169969119078E23C4Ec632D01bDa329b',
      USDC: '0xB56df4fA49847e7B659B5ed4A133512635fF2577',
      LAY: '0xEB741C051E474f83cff38B44A912281772C23CE6',
    },
    [eAstarNetwork.shiden]: {
      ASTR: '0x44a26AE046a01d99eBAbecc24B4d61B388656871',
      SDN: '0x7cA69766F4be8Ec93dD01E1d571e64b867455e58',
      ETH: '0x72fE832eB0452285e91CA9F46B85229A5107CeE8',
      WBTC: '0xEdAA9f408ac11339766a4E5e0d4653BDee52fcA1', // for DIAOracleV2
      USDT: '0xdB25FDCCe3E63B376D308dC2D46234632d9959d8',
      USDC: '0x458db3bEf6ffC5212f9359bbDAeD0D5A58129397',
      LAY: '0xb163716cb6c8b0a56e4f57c394A50F173E34181b',
    },
    [eAstarNetwork.astar]: {
      ASTR: '0xAeaaf0e2c81Af264101B9129C00F4440cCF0F720',
      SDN: '0x75364D4F779d0Bd0facD9a218c67f87dD9Aff3b4',
      ETH: '0x81ECac0D6Be0550A00FF064a4f9dd2400585FE9c',
      WBTC: '0xad543f18cFf85c77E140E3E5E3c3392f6Ba9d5CA', // for DIAOracleV2
      USDT: '0x3795C36e7D12A8c252A20C5a7B455f7c57b60283',
      USDC: '0x6a2d262D56735DbA19Dd70682B39F6bE9a931D98',
      LAY: '0x68692054974A8026A9838C338ea53F79539c79af', // TODO: this is one for testing
    },
  },
  ReserveAssets: {
    [eEthereumNetwork.buidlerevm]: {},
    [eEthereumNetwork.coverage]: {},
    [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.tenderly]: {},
    [eAstarNetwork.shibuya]: {},
    [eAstarNetwork.shiden]: {},
    [eAstarNetwork.astar]: {},
  },
  ReservesConfig: {},
  LTokenDomainSeparator: {
    [eEthereumNetwork.buidlerevm]:
      '0xbae024d959c6a022dc5ed37294cd39c141034b2ae5f02a955cce75c930a81bf5',
    [eEthereumNetwork.coverage]:
      '0x95b73a72c6ecf4ccbbba5178800023260bad8e75cdccdb8e4827a2977a37c820',
    [eEthereumNetwork.hardhat]:
      '0xbae024d959c6a022dc5ed37294cd39c141034b2ae5f02a955cce75c930a81bf5',
    [eEthereumNetwork.tenderly]: '',
    [eAstarNetwork.shibuya]: '',
    [eAstarNetwork.shiden]: '',
    [eAstarNetwork.astar]: '',
  },
  WETH: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.tenderly]: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    [eAstarNetwork.shibuya]: '',
    [eAstarNetwork.shiden]: '',
    [eAstarNetwork.astar]: '',
  },
  WrappedNativeToken: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.tenderly]: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    [eAstarNetwork.shibuya]: '0x8Fd43fea01125EcA2bEb0bB03509946ECA99eEf9',
    [eAstarNetwork.shiden]: '0x44a26AE046a01d99eBAbecc24B4d61B388656871', //WASTR
    [eAstarNetwork.astar]: '0xAeaaf0e2c81Af264101B9129C00F4440cCF0F720', //WASTR
  },
  ReserveFactorTreasuryAddress: {
    [eEthereumNetwork.buidlerevm]: '0x464c71f6c2f760dda6093dcb91c24c39e5d6e18c',
    [eEthereumNetwork.coverage]: '0x464c71f6c2f760dda6093dcb91c24c39e5d6e18c',
    [eEthereumNetwork.hardhat]: '0x464c71f6c2f760dda6093dcb91c24c39e5d6e18c',
    [eEthereumNetwork.tenderly]: '0x464c71f6c2f760dda6093dcb91c24c39e5d6e18c',
    [eAstarNetwork.shibuya]: ZERO_ADDRESS,
    [eAstarNetwork.shiden]: '0xCdfc500F7f0FCe1278aECb0340b523cD55b3EBbb', //brd dev
    [eAstarNetwork.astar]: '0xCdfc500F7f0FCe1278aECb0340b523cD55b3EBbb', // starlay team account
  },
  IncentivesController: {
    [eEthereumNetwork.buidlerevm]: ZERO_ADDRESS,
    [eEthereumNetwork.coverage]: ZERO_ADDRESS,
    [eEthereumNetwork.hardhat]: ZERO_ADDRESS,
    [eEthereumNetwork.tenderly]: ZERO_ADDRESS,
    [eAstarNetwork.shibuya]: '0xdAA12ca33c3f7aEd6B3483ffF61B53D1D1cB8aA2',
    [eAstarNetwork.shiden]: '0x51e27157845bf1B72A5493F539680203B1727438',
    [eAstarNetwork.astar]: ZERO_ADDRESS,
  },
  StakedLay: {
    [eEthereumNetwork.buidlerevm]: ZERO_ADDRESS,
    [eEthereumNetwork.coverage]: ZERO_ADDRESS,
    [eEthereumNetwork.hardhat]: ZERO_ADDRESS,
    [eEthereumNetwork.tenderly]: ZERO_ADDRESS,
    [eAstarNetwork.shibuya]: ZERO_ADDRESS,
    [eAstarNetwork.shiden]: '0x4cFf3b5f6bA3d64083963DE201089f3267490C65',
    [eAstarNetwork.astar]: ZERO_ADDRESS,
  },
};
