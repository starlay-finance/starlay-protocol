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
  DIAAggregator: {
    [eAstarNetwork.shibuya]: {
      SBY: '0xCD233fBd0D45C3C3bcdcE8543529290166790DD0', //created through dev:migration
      ETH: '0x6905e3e220c33E38379C5255185f4946f9433504', //created through dev:migration
      BTC: '0x5eC0E19eBAf29D6Abd042D00981F982844c93134', //created through dev:migration
      SDN: '0xE48a5cab6326eE1a8328D5bdCA1B3c487cc5E1aE', //created through dev:migration
      USDC: '0x7C0E606f0915d94473D4bc9507BE51C1daAda5BF', //created through dev:migration
      USDT: '0x96f263a277B2508568f3Bd21f095f5a365Ab755D', //created through dev:migration
    },
  },
  DIAAggregatorAddress: {
    [eAstarNetwork.shibuya]: '',
  },
  PriceAggregator: {
    [eAstarNetwork.shibuya]: '',
  },
  // ----------------
  // COMMON PROTOCOL PARAMS ACROSS POOLS AND NETWORKS
  // ----------------

  Mocks: {
    AllAssetsInitialPrices: {
      ...MOCK_CHAINLINK_AGGREGATORS_PRICES,
    },
  },
  // TODO: reorg alphabetically, checking the reason of tests failing
  LendingRateOracleRatesCommon: {
    WASTR: {
      borrowRate: oneRay.multipliedBy(0.039).toFixed(),
    },
    WETH: {
      borrowRate: oneRay.multipliedBy(0.03).toFixed(),
    },
    WBTC: {
      borrowRate: oneRay.multipliedBy(0.03).toFixed(),
    },
    WSDN: {
      borrowRate: oneRay.multipliedBy(0.03).toFixed(),
    },
    USDC: {
      borrowRate: oneRay.multipliedBy(0.039).toFixed(),
    },
    USDT: {
      borrowRate: oneRay.multipliedBy(0.035).toFixed(),
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
  EmergencyAdminIndex: 1,
  EmergencyAdmin: {
    [eAstarNetwork.shibuya]: undefined,
  },
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
    [eAstarNetwork.shibuya]: '0x89015CEd5436610374a18AF3feB0deaE13419Af5', //created through dev:migration
  },
  ChainlinkAggregator: {
    [eAstarNetwork.shibuya]: {
      WASTR: '',
      WETH: '0x6905e3e220c33E38379C5255185f4946f9433504', //created through dev:migration
      WBTC: '0x5eC0E19eBAf29D6Abd042D00981F982844c93134', //created through dev:migration
      WSDN: '0xE48a5cab6326eE1a8328D5bdCA1B3c487cc5E1aE', //created through dev:migration
      USDC: '0x7C0E606f0915d94473D4bc9507BE51C1daAda5BF', //created through dev:migration
      USDT: '0x96f263a277B2508568f3Bd21f095f5a365Ab755D', //created through dev:migration
    },
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
    [eAstarNetwork.shibuya]: '0x7ECA847c7F0820fB03B99B69985bb374bb5c543B', // WASTR
  },
  ReserveFactorTreasuryAddress: {
    [eAstarNetwork.shibuya]: ZERO_ADDRESS,
  },
  IncentivesController: {
    [eAstarNetwork.shibuya]: ZERO_ADDRESS,
  },
};
