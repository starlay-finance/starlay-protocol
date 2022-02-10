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
    [eEthereumNetwork.main]: undefined,
    [eEthereumNetwork.tenderly]: undefined,
    [eAstarNetwork.shibuya]: undefined,
  },
  PoolAdminIndex: 0,
  EmergencyAdmin: {
    [eEthereumNetwork.buidlerevm]: undefined,
    [eEthereumNetwork.coverage]: undefined,
    [eEthereumNetwork.hardhat]: undefined,
    [eEthereumNetwork.main]: undefined,
    [eEthereumNetwork.tenderly]: undefined,
    [eAstarNetwork.shibuya]: undefined,
  },
  EmergencyAdminIndex: 1,
  ProviderRegistry: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.main]: '0x52D306e36E3B6B02c153d0266ff0f85d18BCD413',
    [eEthereumNetwork.tenderly]: '0x52D306e36E3B6B02c153d0266ff0f85d18BCD413',
    [eAstarNetwork.shibuya]: '',
  },
  ProviderRegistryOwner: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.main]: '0xB9062896ec3A615a4e4444DF183F0531a77218AE',
    [eEthereumNetwork.tenderly]: '0xB9062896ec3A615a4e4444DF183F0531a77218AE',
    [eAstarNetwork.shibuya]: '',
  },
  LendingRateOracle: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.main]: '', //'0x8A32f49FFbA88aba6EFF96F45D8BD1D4b3f35c7D',
    [eEthereumNetwork.tenderly]: '0x8A32f49FFbA88aba6EFF96F45D8BD1D4b3f35c7D',
    [eAstarNetwork.shibuya]: '',
  },
  LendingPoolCollateralManager: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.main]: '0xbd4765210d4167CE2A5b87280D9E8Ee316D5EC7C',
    [eEthereumNetwork.tenderly]: '0xbd4765210d4167CE2A5b87280D9E8Ee316D5EC7C',
    [eAstarNetwork.shibuya]: '',
  },
  LendingPoolConfigurator: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.main]: '',
    [eEthereumNetwork.tenderly]: '',
    [eAstarNetwork.shibuya]: '',
  },
  LendingPool: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.main]: '',
    [eEthereumNetwork.tenderly]: '',
    [eAstarNetwork.shibuya]: '',
  },
  WethGateway: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.main]: '',
    [eEthereumNetwork.tenderly]: '',
    [eAstarNetwork.shibuya]: '',
  },
  TokenDistributor: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.main]: '0xe3d9988f676457123c5fd01297605efdd0cba1ae',
    [eEthereumNetwork.tenderly]: '0xe3d9988f676457123c5fd01297605efdd0cba1ae',
    [eAstarNetwork.shibuya]: '',
  },
  DIAAggregatorAddress: {
    // https://docs.diadata.org/documentation/oracle-documentation/deployed-contracts#astar-shiden
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.main]: '',
    [eEthereumNetwork.tenderly]: '',
    [eAstarNetwork.shibuya]: '0x1232acd632dd75f874e357c77295da3f5cd7733e',
    // [eAstarNetwork.shiden]: '0xCe784F99f87dBa11E0906e2fE954b08a8cc9815d',
    // [eAstarNetwork.astar]: '0xd79357ebb0cd724e391f2b49a8De0E31688fEc75',
  },
  PriceAggregator: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.main]: '', //'0xA50ba011c48153De246E5192C8f9258A2ba79Ca9',
    [eEthereumNetwork.tenderly]: '0xA50ba011c48153De246E5192C8f9258A2ba79Ca9',
    [eAstarNetwork.shibuya]: '',
  },
  StarlayOracle: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.main]: '',
    [eEthereumNetwork.tenderly]: '',
    [eAstarNetwork.shibuya]: '',
  },
  FallbackOracle: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.main]: ZERO_ADDRESS,
    [eEthereumNetwork.tenderly]: ZERO_ADDRESS,
    [eAstarNetwork.shibuya]: ZERO_ADDRESS,
  },
  ChainlinkAggregator: {
    [eEthereumNetwork.buidlerevm]: {},
    [eEthereumNetwork.coverage]: {},
    [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.main]: {},
    [eEthereumNetwork.tenderly]: {},
    [eAstarNetwork.shibuya]: {},
  },
  DIAAggregator: {
    // key: without 'w' to call function of DIA e.g WBTC->BTC
    // ref: https://docs.diadata.org/documentation/oracle-documentation/crypto-assets
    [eEthereumNetwork.buidlerevm]: {},
    [eEthereumNetwork.coverage]: {},
    [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.main]: {},
    [eEthereumNetwork.tenderly]: {},
    [eAstarNetwork.shibuya]: {
      BTC: '0x2025efC28f85c717df189916344ECa168AAD0667', // TODO: WBTC
      ETH: '0x04efa209F9e74E612a529c393Cf9F1141E696F06', // WETH
      SDN: '0xB9F3803304b582fCd852365aD75192FEA089D49F', // WSDN
      USDC: '0xA4F42578c723A5B6781A9F49d586B8645ba85C31',
      USDT: '0x3f815e7d299f08278c0308aE1048aa45ED12415f', // TODO:
      ASTR: '0x674421E9567653EE76e96fEEA3B2B2966d000Dbd', // WASTR
      LAY: '0x1302f8D1e37B8b83C7c3eB3b02E0e7eEAc28929f', // TODO:
    },
  },
  ReserveAssets: {
    [eEthereumNetwork.buidlerevm]: {},
    [eEthereumNetwork.coverage]: {},
    [eEthereumNetwork.hardhat]: {},
    [eEthereumNetwork.main]: {},
    [eEthereumNetwork.tenderly]: {},
    [eAstarNetwork.shibuya]: {},
  },
  ReservesConfig: {},
  LTokenDomainSeparator: {
    [eEthereumNetwork.buidlerevm]:
      '0xbae024d959c6a022dc5ed37294cd39c141034b2ae5f02a955cce75c930a81bf5',
    [eEthereumNetwork.coverage]:
      '0x95b73a72c6ecf4ccbbba5178800023260bad8e75cdccdb8e4827a2977a37c820',
    [eEthereumNetwork.hardhat]:
      '0xbae024d959c6a022dc5ed37294cd39c141034b2ae5f02a955cce75c930a81bf5',
    [eEthereumNetwork.main]: '',
    [eEthereumNetwork.tenderly]: '',
    [eAstarNetwork.shibuya]: '',
  },
  WETH: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.main]: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    [eEthereumNetwork.tenderly]: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    [eAstarNetwork.shibuya]: '',
  },
  WrappedNativeToken: {
    [eEthereumNetwork.buidlerevm]: '',
    [eEthereumNetwork.coverage]: '',
    [eEthereumNetwork.hardhat]: '',
    [eEthereumNetwork.main]: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    [eEthereumNetwork.tenderly]: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    [eAstarNetwork.shibuya]: '0x674421E9567653EE76e96fEEA3B2B2966d000Dbd',
  },
  ReserveFactorTreasuryAddress: {
    [eEthereumNetwork.buidlerevm]: '0x464c71f6c2f760dda6093dcb91c24c39e5d6e18c',
    [eEthereumNetwork.coverage]: '0x464c71f6c2f760dda6093dcb91c24c39e5d6e18c',
    [eEthereumNetwork.hardhat]: '0x464c71f6c2f760dda6093dcb91c24c39e5d6e18c',
    [eEthereumNetwork.main]: '0x464c71f6c2f760dda6093dcb91c24c39e5d6e18c',
    [eEthereumNetwork.tenderly]: '0x464c71f6c2f760dda6093dcb91c24c39e5d6e18c',
    [eAstarNetwork.shibuya]: ZERO_ADDRESS,
  },
  IncentivesController: {
    [eEthereumNetwork.buidlerevm]: ZERO_ADDRESS,
    [eEthereumNetwork.coverage]: ZERO_ADDRESS,
    [eEthereumNetwork.hardhat]: ZERO_ADDRESS,
    [eEthereumNetwork.main]: ZERO_ADDRESS,
    [eEthereumNetwork.tenderly]: ZERO_ADDRESS,
    [eAstarNetwork.shibuya]: ZERO_ADDRESS,
  },
};
