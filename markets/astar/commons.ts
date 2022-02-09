import {
  MOCK_CHAINLINK_AGGREGATORS_PRICES,
  oneRay,
  oneUsd,
  ZERO_ADDRESS,
} from '../../helpers/constants';
import { eAstarNetwork, ICommonConfiguration } from '../../helpers/types';

// ----------------
// PROTOCOL GLOBAL PARAMS
// ----------------

export const CommonsConfig: ICommonConfiguration = {
  MarketId: 'Commons',
  LTokenNamePrefix: 'Starlay Astar Market',
  StableDebtTokenNamePrefix: 'Starlay Astar Market stable debt',
  VariableDebtTokenNamePrefix: 'Starlay Astar Market variable debt',
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
      ...MOCK_CHAINLINK_AGGREGATORS_PRICES,
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
    [eAstarNetwork.shibuya]: undefined,
  },
  PoolAdminIndex: 0,
  EmergencyAdmin: {
    [eAstarNetwork.shibuya]: undefined,
  },
  EmergencyAdminIndex: 1,
  ProviderRegistry: {
    [eAstarNetwork.shibuya]: '',
  },
  ProviderRegistryOwner: {
    [eAstarNetwork.shibuya]: '',
  },
  LendingRateOracle: {
    [eAstarNetwork.shibuya]: '',
  },
  LendingPoolCollateralManager: {
    [eAstarNetwork.shibuya]: '',
  },
  LendingPoolConfigurator: {
    [eAstarNetwork.shibuya]: '',
  },
  LendingPool: {
    [eAstarNetwork.shibuya]: '',
  },
  WethGateway: {
    [eAstarNetwork.shibuya]: '',
  },
  TokenDistributor: {
    [eAstarNetwork.shibuya]: '',
  },
  StarlayOracle: {
    [eAstarNetwork.shibuya]: '',
  },
  FallbackOracle: {
    // any address needed
    [eAstarNetwork.shibuya]: ZERO_ADDRESS,
  },
  DIAAggregator: {
    // key: without 'w' to call function of DIA e.g WBTC->BTC
    // ref: https://docs.diadata.org/documentation/oracle-documentation/crypto-assets
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
  DIAAggregatorAddress: {
    // https://docs.diadata.org/documentation/oracle-documentation/deployed-contracts#astar-shiden
    [eAstarNetwork.shibuya]: '0x1232acd632dd75f874e357c77295da3f5cd7733e',
    // [eAstarNetwork.shiden]: '0xCe784F99f87dBa11E0906e2fE954b08a8cc9815d',
    // [eAstarNetwork.astar]: '0xd79357ebb0cd724e391f2b49a8De0E31688fEc75',
  },
  PriceAggregator: {
    [eAstarNetwork.shibuya]: '',
  },
  ChainlinkAggregator: {
    [eAstarNetwork.shibuya]: {},
  },
  ReserveAssets: {
    [eAstarNetwork.shibuya]: {},
  },
  ReservesConfig: {},
  LTokenDomainSeparator: {
    [eAstarNetwork.shibuya]: '',
  },
  WETH: {
    [eAstarNetwork.shibuya]: '',
  },
  WrappedNativeToken: {
    [eAstarNetwork.shibuya]: '0x674421E9567653EE76e96fEEA3B2B2966d000Dbd',
  },
  ReserveFactorTreasuryAddress: {
    [eAstarNetwork.shibuya]: ZERO_ADDRESS,
  },
  IncentivesController: {
    [eAstarNetwork.shibuya]: ZERO_ADDRESS,
  },
};
