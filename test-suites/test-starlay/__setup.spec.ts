import { MockContract } from 'ethereum-waffle';
import { Signer } from 'ethers';
import rawBRE from 'hardhat';
import {
  ConfigNames,
  getReservesConfigByPool,
  getTreasuryAddress,
  loadPoolConfig,
} from '../../helpers/configuration';
import {
  ALL_ASSETS_PRICES_FOR_TESTING,
  oneEther,
  oneRay,
  ZERO_ADDRESS,
} from '../../helpers/constants';
import {
  authorizeWETHGateway,
  deployLendingPool,
  deployLendingPoolAddressesProvider,
  deployLendingPoolAddressesProviderRegistry,
  deployLendingPoolCollateralManager,
  deployLendingPoolConfigurator,
  deployLendingRateOracle,
  deployLTokenImplementations,
  deployLTokensAndRatesHelper,
  deployMintableERC20,
  deployMockFlashLoanReceiver,
  deployPriceOracle,
  deployStableAndVariableTokensHelper,
  deployStarlayOracle,
  deployStarlayProtocolDataProvider,
  deployWalletBalancerProvider,
  deployWETHGateway,
  deployWETHMocked,
} from '../../helpers/contracts-deployments';
import { getLendingPool, getLendingPoolConfiguratorProxy } from '../../helpers/contracts-getters';
import {
  getEthersSigners,
  getEthersSignersAddresses,
  insertContractAddressInDb,
  registerContractInJsonDb,
} from '../../helpers/contracts-helpers';
import { configureReservesByHelper, initReservesByHelper } from '../../helpers/init-helpers';
import { waitForTx } from '../../helpers/misc-utils';
import {
  deployMockAggregators,
  setInitialAssetPricesInOracle,
  setInitialMarketRatesInRatesOracleByHelper,
} from '../../helpers/oracles-helpers';
import { eContractid, StarlayPools, tEthereumAddress, TokenContractId } from '../../helpers/types';
import StarlayConfig from '../../markets/starlay';
import { strategyDAIForTest } from '../../markets/starlay/reservesConfigs';
import { MintableERC20 } from '../../types/MintableERC20';
import { WETH9Mocked } from '../../types/WETH9Mocked';
import { initializeMakeSuite } from './helpers/make-suite';

const ALL_ASSETS_INITIAL_PRICES = ALL_ASSETS_PRICES_FOR_TESTING;
const LENDING_RATE_ORACLE_RATES_COMMON = {
  ...StarlayConfig.LendingRateOracleRatesCommon,
  DAI: {
    borrowRate: oneRay.multipliedBy(0.039).toFixed(),
  },
};
const USD_ADDRESS = StarlayConfig.ProtocolGlobalParams.UsdAddress;
const MOCK_USD_PRICE_IN_WEI = StarlayConfig.ProtocolGlobalParams.MockUsdPriceInWei;

const deployAllMockTokens = async (deployer: Signer) => {
  const tokens: { [symbol: string]: MintableERC20 | WETH9Mocked } = {};

  const protoConfigData = getReservesConfigByPool(StarlayPools.proto);
  const testTokenContracId = [...TokenContractId, 'DAI'];
  for (const tokenSymbol of Object.values(testTokenContracId)) {
    if (tokenSymbol === 'WETH') {
      tokens[tokenSymbol] = await deployWETHMocked();
      await registerContractInJsonDb(tokenSymbol.toUpperCase(), tokens[tokenSymbol]);
      continue;
    }
    let decimals = 18;

    let configData = (<any>protoConfigData)[tokenSymbol];

    if (!configData) {
      decimals = 18;
    }

    tokens[tokenSymbol] = await deployMintableERC20([
      tokenSymbol,
      tokenSymbol,
      configData ? configData.reserveDecimals : 18,
    ]);
    await registerContractInJsonDb(tokenSymbol.toUpperCase(), tokens[tokenSymbol]);
  }

  return tokens;
};

const buildTestEnv = async (deployer: Signer, secondaryWallet: Signer) => {
  console.time('setup');
  const starlayAdmin = await deployer.getAddress();
  const config = loadPoolConfig(ConfigNames.Starlay);

  const mockTokens: {
    [symbol: string]: MockContract | MintableERC20 | WETH9Mocked;
  } = {
    ...(await deployAllMockTokens(deployer)),
  };
  const addressesProvider = await deployLendingPoolAddressesProvider(StarlayConfig.MarketId);
  await waitForTx(await addressesProvider.setPoolAdmin(starlayAdmin));

  //setting users[1] as emergency admin, which is in position 2 in the DRE addresses list
  const addressList = await getEthersSignersAddresses();

  await waitForTx(await addressesProvider.setEmergencyAdmin(addressList[2]));

  const addressesProviderRegistry = await deployLendingPoolAddressesProviderRegistry();
  await waitForTx(
    await addressesProviderRegistry.registerAddressesProvider(addressesProvider.address, 1)
  );

  const lendingPoolImpl = await deployLendingPool();

  await waitForTx(await addressesProvider.setLendingPoolImpl(lendingPoolImpl.address));

  const lendingPoolAddress = await addressesProvider.getLendingPool();
  const lendingPoolProxy = await getLendingPool(lendingPoolAddress);

  await insertContractAddressInDb(eContractid.LendingPool, lendingPoolProxy.address);

  const lendingPoolConfiguratorImpl = await deployLendingPoolConfigurator();
  await waitForTx(
    await addressesProvider.setLendingPoolConfiguratorImpl(lendingPoolConfiguratorImpl.address)
  );
  const lendingPoolConfiguratorProxy = await getLendingPoolConfiguratorProxy(
    await addressesProvider.getLendingPoolConfigurator()
  );
  await insertContractAddressInDb(
    eContractid.LendingPoolConfigurator,
    lendingPoolConfiguratorProxy.address
  );

  // Deploy deployment helpers
  await deployStableAndVariableTokensHelper([lendingPoolProxy.address, addressesProvider.address]);
  await deployLTokensAndRatesHelper([
    lendingPoolProxy.address,
    addressesProvider.address,
    lendingPoolConfiguratorProxy.address,
  ]);

  const fallbackOracle = await deployPriceOracle();

  await waitForTx(await fallbackOracle.setEthUsdPrice(MOCK_USD_PRICE_IN_WEI));
  const addresses = {
    WETH: mockTokens.WETH.address,
    DAI: mockTokens.DAI.address,
    USDC: mockTokens.USDC.address,
    USDT: mockTokens.USDT.address,
    LAY: mockTokens.LAY.address,
    WBTC: mockTokens.WBTC.address,
    USD: USD_ADDRESS,
    WASTR: mockTokens.WASTR.address,
    WSDN: mockTokens.WSDN.address,
    BUSD: mockTokens.BUSD.address,
  };
  await setInitialAssetPricesInOracle(ALL_ASSETS_INITIAL_PRICES, addresses, fallbackOracle);

  const allTokenAddresses = Object.entries(mockTokens).reduce(
    (accum: { [tokenSymbol: string]: tEthereumAddress }, [tokenSymbol, tokenContract]) => ({
      ...accum,
      [tokenSymbol]: tokenContract.address,
    }),
    {}
  );

  const priceAggregator = await deployMockAggregators(ALL_ASSETS_INITIAL_PRICES, addresses);

  await deployStarlayOracle([
    priceAggregator.address,
    fallbackOracle.address,
    mockTokens.WETH.address,
    oneEther.toString(),
  ]);
  await waitForTx(await addressesProvider.setPriceOracle(fallbackOracle.address));

  const lendingRateOracle = await deployLendingRateOracle();
  await waitForTx(await addressesProvider.setLendingRateOracle(lendingRateOracle.address));

  const { USD, ...tokensAddressesWithoutUsd } = allTokenAddresses;
  const allReservesAddresses = {
    ...tokensAddressesWithoutUsd,
  };
  await setInitialMarketRatesInRatesOracleByHelper(
    LENDING_RATE_ORACLE_RATES_COMMON,
    allReservesAddresses,
    lendingRateOracle,
    starlayAdmin
  );

  // Reserve params from STARLAY pool + mocked tokens
  const reservesParams = {
    ...config.ReservesConfig,
    DAI: strategyDAIForTest,
  };

  const testHelpers = await deployStarlayProtocolDataProvider(addressesProvider.address);

  await deployLTokenImplementations(ConfigNames.Starlay, reservesParams, false);

  const admin = await deployer.getAddress();

  const { LTokenNamePrefix, StableDebtTokenNamePrefix, VariableDebtTokenNamePrefix, SymbolPrefix } =
    config;
  const treasuryAddress = await getTreasuryAddress(config);

  await initReservesByHelper(
    reservesParams,
    allReservesAddresses,
    LTokenNamePrefix,
    StableDebtTokenNamePrefix,
    VariableDebtTokenNamePrefix,
    SymbolPrefix,
    admin,
    treasuryAddress,
    ZERO_ADDRESS,
    ConfigNames.Starlay,
    false
  );

  await configureReservesByHelper(reservesParams, allReservesAddresses, testHelpers, admin);

  const collateralManager = await deployLendingPoolCollateralManager();
  await waitForTx(
    await addressesProvider.setLendingPoolCollateralManager(collateralManager.address)
  );
  await deployMockFlashLoanReceiver(addressesProvider.address);

  await deployWalletBalancerProvider();

  const gateWay = await deployWETHGateway([mockTokens.WETH.address]);
  await authorizeWETHGateway(gateWay.address, lendingPoolAddress);

  console.timeEnd('setup');
};

before(async () => {
  await rawBRE.run('set-DRE');
  const [deployer, secondaryWallet] = await getEthersSigners();
  const FORK = process.env.FORK;

  if (FORK) {
    await rawBRE.run('starlay:astar', { skipRegistry: true });
  } else {
    console.log('-> Deploying test environment...');
    await buildTestEnv(deployer, secondaryWallet);
  }

  await initializeMakeSuite();
  console.log('\n***************');
  console.log('Setup and snapshot finished');
  console.log('***************\n');
});
