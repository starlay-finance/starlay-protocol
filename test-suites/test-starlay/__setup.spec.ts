import { MockContract } from 'ethereum-waffle';
import { Signer } from 'ethers';
import rawBRE from 'hardhat';
import {
  ConfigNames,
  getReservesConfigByPool,
  getTreasuryAddress,
  loadPoolConfig,
} from '../../helpers/configuration';
import { oneEther, ZERO_ADDRESS } from '../../helpers/constants';
import {
  authorizeWETHGateway,
  deployAaveOracle,
  deployAaveProtocolDataProvider,
  deployATokenImplementations,
  deployATokensAndRatesHelper,
  deployFlashLiquidationAdapter,
  deployLendingPool,
  deployLendingPoolAddressesProvider,
  deployLendingPoolAddressesProviderRegistry,
  deployLendingPoolCollateralManager,
  deployLendingPoolConfigurator,
  deployLendingRateOracle,
  deployMintableERC20,
  deployMockFlashLoanReceiver,
  deployMockParaSwapAugustus,
  deployMockParaSwapAugustusRegistry,
  deployMockUniswapRouter,
  deployParaSwapLiquiditySwapAdapter,
  deployPriceOracle,
  deployStableAndVariableTokensHelper,
  deployUniswapLiquiditySwapAdapter,
  deployUniswapRepayAdapter,
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
import { AavePools, eContractid, tEthereumAddress, TokenContractId } from '../../helpers/types';
import AaveConfig from '../../markets/aave';
import { MintableERC20 } from '../../types/MintableERC20';
import { WETH9Mocked } from '../../types/WETH9Mocked';
import { initializeMakeSuite } from './helpers/make-suite';

const MOCK_USD_PRICE_IN_WEI = AaveConfig.ProtocolGlobalParams.MockUsdPriceInWei;
const ALL_ASSETS_INITIAL_PRICES = AaveConfig.Mocks.AllAssetsInitialPrices;
const USD_ADDRESS = AaveConfig.ProtocolGlobalParams.UsdAddress;
const LENDING_RATE_ORACLE_RATES_COMMON = AaveConfig.LendingRateOracleRatesCommon;

const deployAllMockTokens = async (deployer: Signer) => {
  const tokens: { [symbol: string]: MockContract | MintableERC20 | WETH9Mocked } = {};

  const protoConfigData = getReservesConfigByPool(AavePools.proto);

  for (const tokenSymbol of Object.keys(TokenContractId)) {
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
  const aaveAdmin = await deployer.getAddress();
  const config = loadPoolConfig(ConfigNames.Aave);

  const mockTokens: {
    [symbol: string]: MockContract | MintableERC20 | WETH9Mocked;
  } = {
    ...(await deployAllMockTokens(deployer)),
  };
  const addressesProvider = await deployLendingPoolAddressesProvider(AaveConfig.MarketId);
  await waitForTx(await addressesProvider.setPoolAdmin(aaveAdmin));

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
  await deployATokensAndRatesHelper([
    lendingPoolProxy.address,
    addressesProvider.address,
    lendingPoolConfiguratorProxy.address,
  ]);

  const fallbackOracle = await deployPriceOracle();

  await waitForTx(await fallbackOracle.setEthUsdPrice(MOCK_USD_PRICE_IN_WEI));
  const addresses = {
    WETH: mockTokens.WETH.address,
    DAI: mockTokens.DAI.address,
    TUSD: mockTokens.TUSD.address,
    USDC: mockTokens.USDC.address,
    USDT: mockTokens.USDT.address,
    SUSD: mockTokens.SUSD.address,
    AAVE: mockTokens.AAVE.address,
    BAT: mockTokens.BAT.address,
    MKR: mockTokens.MKR.address,
    LINK: mockTokens.LINK.address,
    KNC: mockTokens.KNC.address,
    WBTC: mockTokens.WBTC.address,
    MANA: mockTokens.MANA.address,
    ZRX: mockTokens.ZRX.address,
    SNX: mockTokens.SNX.address,
    BUSD: mockTokens.BUSD.address,
    YFI: mockTokens.BUSD.address,
    REN: mockTokens.REN.address,
    UNI: mockTokens.UNI.address,
    ENJ: mockTokens.ENJ.address,
    // DAI: mockTokens.LpDAI.address,
    // USDC: mockTokens.LpUSDC.address,
    // USDT: mockTokens.LpUSDT.address,
    // WBTC: mockTokens.LpWBTC.address,
    // WETH: mockTokens.LpWETH.address,
    UniDAIWETH: mockTokens.UniDAIWETH.address,
    UniWBTCWETH: mockTokens.UniWBTCWETH.address,
    UniAAVEWETH: mockTokens.UniAAVEWETH.address,
    UniBATWETH: mockTokens.UniBATWETH.address,
    UniDAIUSDC: mockTokens.UniDAIUSDC.address,
    UniCRVWETH: mockTokens.UniCRVWETH.address,
    UniLINKWETH: mockTokens.UniLINKWETH.address,
    UniMKRWETH: mockTokens.UniMKRWETH.address,
    UniRENWETH: mockTokens.UniRENWETH.address,
    UniSNXWETH: mockTokens.UniSNXWETH.address,
    UniUNIWETH: mockTokens.UniUNIWETH.address,
    UniUSDCWETH: mockTokens.UniUSDCWETH.address,
    UniWBTCUSDC: mockTokens.UniWBTCUSDC.address,
    UniYFIWETH: mockTokens.UniYFIWETH.address,
    BptWBTCWETH: mockTokens.BptWBTCWETH.address,
    BptBALWETH: mockTokens.BptBALWETH.address,
    USD: USD_ADDRESS,
    STAKE: mockTokens.STAKE.address,
    xSUSHI: mockTokens.xSUSHI.address,
    WSBY: mockTokens.WSBY.address,
    WSDN: mockTokens.WSDN.address,
    ARSW: mockTokens.ARSW.address,
    VEIN: mockTokens.VEIN.address,
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

  await deployAaveOracle([
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
    aaveAdmin
  );

  // Reserve params from AAVE pool + mocked tokens
  const reservesParams = {
    ...config.ReservesConfig,
  };

  const testHelpers = await deployAaveProtocolDataProvider(addressesProvider.address);

  await deployATokenImplementations(ConfigNames.Aave, reservesParams, false);

  const admin = await deployer.getAddress();

  const { ATokenNamePrefix, StableDebtTokenNamePrefix, VariableDebtTokenNamePrefix, SymbolPrefix } =
    config;
  const treasuryAddress = await getTreasuryAddress(config);

  await initReservesByHelper(
    reservesParams,
    allReservesAddresses,
    ATokenNamePrefix,
    StableDebtTokenNamePrefix,
    VariableDebtTokenNamePrefix,
    SymbolPrefix,
    admin,
    treasuryAddress,
    ZERO_ADDRESS,
    ConfigNames.Aave,
    false
  );

  await configureReservesByHelper(reservesParams, allReservesAddresses, testHelpers, admin);

  const collateralManager = await deployLendingPoolCollateralManager();
  await waitForTx(
    await addressesProvider.setLendingPoolCollateralManager(collateralManager.address)
  );
  await deployMockFlashLoanReceiver(addressesProvider.address);

  const mockUniswapRouter = await deployMockUniswapRouter();

  const adapterParams: [string, string, string] = [
    addressesProvider.address,
    mockUniswapRouter.address,
    mockTokens.WETH.address,
  ];

  await deployUniswapLiquiditySwapAdapter(adapterParams);
  await deployUniswapRepayAdapter(adapterParams);
  await deployFlashLiquidationAdapter(adapterParams);

  const augustus = await deployMockParaSwapAugustus();

  const augustusRegistry = await deployMockParaSwapAugustusRegistry([augustus.address]);

  await deployParaSwapLiquiditySwapAdapter([addressesProvider.address, augustusRegistry.address]);

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
    await rawBRE.run('starlay:mainnet', { skipRegistry: true });
  } else {
    console.log('-> Deploying test environment...');
    await buildTestEnv(deployer, secondaryWallet);
  }

  await initializeMakeSuite();
  console.log('\n***************');
  console.log('Setup and snapshot finished');
  console.log('***************\n');
});