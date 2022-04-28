import { getTreasuryAddress } from '../../helpers/configuration';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import { task } from 'hardhat/config';
import { ConfigNames, loadPoolConfig } from '../../helpers/configuration';
import { configureReservesByHelper, initReservesByHelper } from '../../helpers/init-helpers';
import { DRE, setDRE } from '../../helpers/misc-utils';
import { eNetwork, ICommonConfiguration } from '../../helpers/types';
import * as marketConfigs from '../../markets/starlay';
import { INITIAL_PRICES } from '../../helpers/constants';
import {
  getLendingPoolAddressesProvider,
  getPriceAggregator as getPriceAggregatorAdapterDiaImpl,
  getStarlayFallbackOracle,
  getStarlayProtocolDataProvider,
} from '../../helpers/contracts-getters';

const SUPPORTED_NETWORK = ["astar", "shiden"] as const
type SupportedNetwork = typeof SUPPORTED_NETWORK[number]

type EthereumAddress = `0x${string}`
type Addresses = {
  LendingPoolAddressProvider: EthereumAddress
  LendingPoolConfigurator: EthereumAddress
  StarlayProtocolDataProvider: EthereumAddress
  StarlayFallbackOracle: EthereumAddress
  PriceAggregatorAdapterDiaImpl: EthereumAddress
}
type Constants = {
  [key in SupportedNetwork]?: Addresses
}
const astar: Addresses = {
  LendingPoolAddressProvider: "0x4c37A76Bf49c01f91E275d5257a228dad1b74EF9",
  LendingPoolConfigurator: "0xa1c2ED9e0d09f5e441aC9C44AFa308D38dAf463c",
  StarlayProtocolDataProvider: "0x5BF9B2644E273D92ff1C31A83476314c95953133",
  StarlayFallbackOracle: "0x35E6D71FeA378B60b3A5Afc91eA7F520F937833c",
  PriceAggregatorAdapterDiaImpl: "0x043C93fF4d52B2F76811852644549553A00309a8",
}
const shiden: Addresses = {
  LendingPoolAddressProvider: "0xa70fFbaFE4B048798bBCBDdfB995fcCec2D1f2CA",
  LendingPoolConfigurator: "0x1aE33143380567fe1246bE4Be5008B7bFa25790A",
  StarlayProtocolDataProvider: "0x3fD308785Cf41F30993038c145cE50b7fF677a71",
  StarlayFallbackOracle: "0xA42D5A35b6bbC93fe63FE54536f320faC9996f4C",
  PriceAggregatorAdapterDiaImpl: "0x8F2fFfF56375CDeD7f53E0D90259711Cd122Da31",
}
const CONSTANTS: Constants = {
  astar: astar,
  shiden: shiden
}
const SYMBOLS = {
  MATIC: 'MATIC',
  BNB: 'BNB'
}

const getReserveAssetAddresss = (network: eNetwork) => ({
  MATIC: marketConfigs.StarlayConfig.ReserveAssets[network][SYMBOLS.MATIC],
  BNB: marketConfigs.StarlayConfig.ReserveAssets[network][SYMBOLS.BNB],
})

// 1: deploy new assets
task(
  'external:deploy-matic-bnb:deploy-new-asset',
  'external:deploy-matic-bnb:deploy-new-asset',
).setAction(async ({ verify }, localBRE) => {
  if (!(SUPPORTED_NETWORK as ReadonlyArray<string>).includes(localBRE.network.name)) throw new Error(`Support only ${SUPPORTED_NETWORK} ...`)
  setDRE(localBRE);

  await DRE.run('external:deploy-new-asset', { symbol: SYMBOLS.MATIC, pool: 'Starlay' });
  await DRE.run('external:deploy-new-asset', { symbol: SYMBOLS.BNB, pool: 'Starlay' });
})
// 2: initialize & configure
task(
  'external:deploy-matic-bnb:init-and-configure',
  'external:deploy-matic-bnb:init-and-configure',
).setAction(async ({ verify }, localBRE) => {
  if (!(SUPPORTED_NETWORK as ReadonlyArray<string>).includes(localBRE.network.name)) throw new Error(`Support only ${SUPPORTED_NETWORK} ...`)
  setDRE(localBRE);

  const network = <eNetwork>localBRE.network.name;
  const pool = ConfigNames.Starlay;
  const poolConfig = loadPoolConfig(pool);

  const {
    LTokenNamePrefix,
    StableDebtTokenNamePrefix,
    VariableDebtTokenNamePrefix,
    SymbolPrefix,
    ReservesConfig,
    IncentivesController,
  } = poolConfig as ICommonConfiguration;

  const reserveAssetAddresss = getReserveAssetAddresss(network)

  const addressProvider = await getLendingPoolAddressesProvider(
    CONSTANTS[network].LendingPoolAddressProvider
  );

  const admin = await addressProvider.getPoolAdmin();
  const treasuryAddress = await getTreasuryAddress(poolConfig);
  const incentivesControllerAddress = getParamPerNetwork(IncentivesController, network);

  console.log('=== init reserves ===');
  await initReservesByHelper(
    ReservesConfig,
    reserveAssetAddresss,
    LTokenNamePrefix,
    StableDebtTokenNamePrefix,
    VariableDebtTokenNamePrefix,
    SymbolPrefix,
    admin,
    treasuryAddress,
    incentivesControllerAddress,
    pool,
    false,
    CONSTANTS[network].LendingPoolAddressProvider,
    CONSTANTS[network].LendingPoolConfigurator,
  );
  const testHelpers = await getStarlayProtocolDataProvider(CONSTANTS[network].StarlayProtocolDataProvider);
  console.log('*** configure reserves ***');
  await configureReservesByHelper(
    ReservesConfig,
    reserveAssetAddresss,
    testHelpers,
    admin
  );
})
// 3: setup oracles for new assets
task(
  'external:deploy-matic-bnb:setup-oracles',
  'external:deploy-matic-bnb:setup-oracles',
).setAction(async ({ verify }, localBRE) => {
  if (!(SUPPORTED_NETWORK as ReadonlyArray<string>).includes(localBRE.network.name)) throw new Error(`Support only ${SUPPORTED_NETWORK} ...`)
  setDRE(localBRE);

  const network = <eNetwork>localBRE.network.name;

  const reserveAssetAddresss = getReserveAssetAddresss(network)

  console.log('*** submit mock prices to fallback oracle ***');
  const priceOracle = await getStarlayFallbackOracle(CONSTANTS[network].StarlayFallbackOracle);
  await priceOracle.submitPrices([reserveAssetAddresss.BNB], [INITIAL_PRICES.BNB]);
  await priceOracle.submitPrices([reserveAssetAddresss.MATIC], [INITIAL_PRICES.MATIC]);

  console.log('*** set asset sources to price oracle dia impl ***');
  const priceOracleDiaImpl = await getPriceAggregatorAdapterDiaImpl(CONSTANTS[network].PriceAggregatorAdapterDiaImpl);
  await priceOracleDiaImpl.setAssetSources([reserveAssetAddresss.BNB], [SYMBOLS.BNB]);
  await priceOracleDiaImpl.setAssetSources([reserveAssetAddresss.MATIC], [SYMBOLS.MATIC]);
})
