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
    [eAstarNetwork.shibuya]: '',
  },
  DIAAggregator: {
    [eAstarNetwork.shibuya]: {},
  },
  DIAAggregatorAddress: {
    [eAstarNetwork.shibuya]: '',
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
    [eAstarNetwork.shibuya]: '',
  },
  ReserveFactorTreasuryAddress: {
    [eAstarNetwork.shibuya]: ZERO_ADDRESS,
  },
  IncentivesController: {
    [eAstarNetwork.shibuya]: ZERO_ADDRESS,
  },
};
