import { readArtifact as buidlerReadArtifact } from '@nomiclabs/buidler/plugins';
import { Contract } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  DefaultReserveInterestRateStrategyFactory,
  DelegationAwareLTokenFactory,
  InitializableAdminUpgradeabilityProxyFactory,
  LendingPoolAddressesProviderFactory,
  LendingPoolAddressesProviderRegistryFactory,
  LendingPoolCollateralManagerFactory,
  LendingPoolConfiguratorFactory,
  LendingPoolFactory,
  LendingRateOracleFactory,
  LTokenFactory,
  LTokensAndRatesHelperFactory,
  MintableDelegationERC20Factory,
  MintableERC20Factory,
  MockAggregatorDIAFactory,
  MockAggregatorFactory,
  MockFlashLoanReceiverFactory,
  MockLTokenFactory,
  MockStableDebtTokenFactory,
  MockVariableDebtTokenFactory,
  PriceOracleFactory,
  ReserveLogicFactory,
  SelfdestructTransferFactory,
  StableDebtTokenFactory,
  StakeUIHelperFactory,
  StarlayFallbackOracleFactory,
  StarlayOracleFactory,
  StarlayProtocolDataProviderFactory,
  UiIncentiveDataProviderV2Factory,
  UiPoolDataProviderV2Factory,
  VariableDebtTokenFactory,
  WalletBalanceProviderFactory,
  WETH9MockedFactory,
  WETHGatewayFactory,
} from '../types';
import { LendingPoolLibraryAddresses } from '../types/LendingPoolFactory';
import { MintableDelegationERC20 } from '../types/MintableDelegationERC20';
import { MintableERC20 } from '../types/MintableERC20';
import { StableAndVariableTokensHelperFactory } from '../types/StableAndVariableTokensHelperFactory';
import { WETH9Mocked } from '../types/WETH9Mocked';
import { PriceAggregatorAdapterDiaImplFactory } from './../types/PriceAggregatorAdapterDiaImplFactory';
import { ConfigNames, getReservesConfigByPool, loadPoolConfig } from './configuration';
import { getFirstSigner } from './contracts-getters';
import {
  getOptionalParamAddressPerNetwork,
  insertContractAddressInDb,
  linkBytecode,
  registerContractInJsonDb,
  withSaveAndVerify,
} from './contracts-helpers';
import { DRE, notFalsyOrZeroAddress } from './misc-utils';
import {
  eContractid,
  eEthereumNetwork,
  eNetwork,
  IReserveParams,
  StarlayPools,
  tEthereumAddress,
  TokenContractId,
} from './types';

export const deployUiIncentiveDataProviderV2 = async (verify?: boolean) =>
  withSaveAndVerify(
    await new UiIncentiveDataProviderV2Factory(await getFirstSigner()).deploy(),
    eContractid.UiIncentiveDataProviderV2,
    [],
    verify
  );

export const deployUiPoolDataProviderV2 = async (
  aggregatorProxy: string,
  baseTokenAddress: string,
  verify?: boolean
) =>
  withSaveAndVerify(
    await new UiPoolDataProviderV2Factory(await getFirstSigner()).deploy(
      aggregatorProxy,
      baseTokenAddress
    ),
    eContractid.UiPoolDataProviderV2,
    [aggregatorProxy, baseTokenAddress],
    verify
  );

const readArtifact = async (id: string) => {
  if (DRE.network.name === eEthereumNetwork.buidlerevm) {
    return buidlerReadArtifact(DRE.config.paths.artifacts, id);
  }
  return (DRE as HardhatRuntimeEnvironment).artifacts.readArtifact(id);
};

export const deployLendingPoolAddressesProvider = async (marketId: string, verify?: boolean) =>
  withSaveAndVerify(
    await new LendingPoolAddressesProviderFactory(await getFirstSigner()).deploy(marketId),
    eContractid.LendingPoolAddressesProvider,
    [marketId],
    verify
  );

export const deployLendingPoolAddressesProviderRegistry = async (verify?: boolean) =>
  withSaveAndVerify(
    await new LendingPoolAddressesProviderRegistryFactory(await getFirstSigner()).deploy(),
    eContractid.LendingPoolAddressesProviderRegistry,
    [],
    verify
  );

export const deployLendingPoolConfigurator = async (verify?: boolean) => {
  const lendingPoolConfiguratorImpl = await new LendingPoolConfiguratorFactory(
    await getFirstSigner()
  ).deploy();
  await insertContractAddressInDb(
    eContractid.LendingPoolConfiguratorImpl,
    lendingPoolConfiguratorImpl.address
  );
  return withSaveAndVerify(
    lendingPoolConfiguratorImpl,
    eContractid.LendingPoolConfigurator,
    [],
    verify
  );
};

export const deployReserveLogicLibrary = async (verify?: boolean) =>
  withSaveAndVerify(
    await new ReserveLogicFactory(await getFirstSigner()).deploy(),
    eContractid.ReserveLogic,
    [],
    verify
  );

export const deployGenericLogic = async (reserveLogic: Contract, verify?: boolean) => {
  const genericLogicArtifact = await readArtifact(eContractid.GenericLogic);

  const linkedGenericLogicByteCode = linkBytecode(genericLogicArtifact, {
    [eContractid.ReserveLogic]: reserveLogic.address,
  });

  const genericLogicFactory = await DRE.ethers.getContractFactory(
    genericLogicArtifact.abi,
    linkedGenericLogicByteCode
  );

  const genericLogic = await (
    await genericLogicFactory.connect(await getFirstSigner()).deploy()
  ).deployed();
  return withSaveAndVerify(genericLogic, eContractid.GenericLogic, [], verify);
};

export const deployValidationLogic = async (
  reserveLogic: Contract,
  genericLogic: Contract,
  verify?: boolean
) => {
  const validationLogicArtifact = await readArtifact(eContractid.ValidationLogic);

  const linkedValidationLogicByteCode = linkBytecode(validationLogicArtifact, {
    [eContractid.ReserveLogic]: reserveLogic.address,
    [eContractid.GenericLogic]: genericLogic.address,
  });

  const validationLogicFactory = await DRE.ethers.getContractFactory(
    validationLogicArtifact.abi,
    linkedValidationLogicByteCode
  );

  const validationLogic = await (
    await validationLogicFactory.connect(await getFirstSigner()).deploy()
  ).deployed();

  return withSaveAndVerify(validationLogic, eContractid.ValidationLogic, [], verify);
};

export const deployStarlayLibraries = async (
  verify?: boolean
): Promise<LendingPoolLibraryAddresses> => {
  const reserveLogic = await deployReserveLogicLibrary(verify);
  const genericLogic = await deployGenericLogic(reserveLogic, verify);
  const validationLogic = await deployValidationLogic(reserveLogic, genericLogic, verify);

  // Hardcoded solidity placeholders, if any library changes path this will fail.
  // The '__$PLACEHOLDER$__ can be calculated via solidity keccak, but the LendingPoolLibraryAddresses Type seems to
  // require a hardcoded string.
  //
  //  how-to:
  //  1. PLACEHOLDER = solidityKeccak256(['string'], `${libPath}:${libName}`).slice(2, 36)
  //  2. LIB_PLACEHOLDER = `__$${PLACEHOLDER}$__`
  // or grab placeholdes from LendingPoolLibraryAddresses at Typechain generation.
  //
  // libPath example: contracts/libraries/logic/GenericLogic.sol
  // libName example: GenericLogic
  return {
    ['__$de8c0cf1a7d7c36c802af9a64fb9d86036$__']: validationLogic.address,
    ['__$22cd43a9dda9ce44e9b92ba393b88fb9ac$__']: reserveLogic.address,
  };
};

export const deployLendingPool = async (verify?: boolean) => {
  const libraries = await deployStarlayLibraries(verify);
  const lendingPoolImpl = await new LendingPoolFactory(libraries, await getFirstSigner()).deploy();
  await insertContractAddressInDb(eContractid.LendingPoolImpl, lendingPoolImpl.address);
  return withSaveAndVerify(lendingPoolImpl, eContractid.LendingPool, [], verify);
};

export const deployPriceOracle = async (verify?: boolean) =>
  withSaveAndVerify(
    await new PriceOracleFactory(await getFirstSigner()).deploy(),
    eContractid.PriceOracle,
    [],
    verify
  );

export const deployStarlayFallbackOracle = async (verify?: boolean) =>
  withSaveAndVerify(
    await new StarlayFallbackOracleFactory(await getFirstSigner()).deploy(),
    eContractid.StarlayFallbackOracle,
    [],
    verify
  );

export const deployLendingRateOracle = async (verify?: boolean) =>
  withSaveAndVerify(
    await new LendingRateOracleFactory(await getFirstSigner()).deploy(),
    eContractid.LendingRateOracle,
    [],
    verify
  );

export const deployMockAggregator = async (
  args: [tEthereumAddress[], string[]],
  verify?: boolean
) =>
  withSaveAndVerify(
    await new MockAggregatorFactory(await getFirstSigner()).deploy(args[0], args[1]),
    eContractid.MockAggregator,
    args,
    verify
  );

export const deployStarlayOracle = async (
  args: [tEthereumAddress, tEthereumAddress, string, string],
  verify?: boolean
) =>
  withSaveAndVerify(
    await new StarlayOracleFactory(await getFirstSigner()).deploy(
      args[0],
      args[1],
      args[2],
      args[3]
    ),
    eContractid.StarlayOracle,
    args,
    verify
  );

export const deployLendingPoolCollateralManager = async (verify?: boolean) => {
  const collateralManagerImpl = await new LendingPoolCollateralManagerFactory(
    await getFirstSigner()
  ).deploy();
  await insertContractAddressInDb(
    eContractid.LendingPoolCollateralManagerImpl,
    collateralManagerImpl.address
  );
  return withSaveAndVerify(
    collateralManagerImpl,
    eContractid.LendingPoolCollateralManager,
    [],
    verify
  );
};

export const deployInitializableAdminUpgradeabilityProxy = async (verify?: boolean) =>
  withSaveAndVerify(
    await new InitializableAdminUpgradeabilityProxyFactory(await getFirstSigner()).deploy(),
    eContractid.InitializableAdminUpgradeabilityProxy,
    [],
    verify
  );

export const deployMockFlashLoanReceiver = async (
  addressesProvider: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await new MockFlashLoanReceiverFactory(await getFirstSigner()).deploy(addressesProvider),
    eContractid.MockFlashLoanReceiver,
    [addressesProvider],
    verify
  );

export const deployWalletBalancerProvider = async (verify?: boolean) =>
  withSaveAndVerify(
    await new WalletBalanceProviderFactory(await getFirstSigner()).deploy(),
    eContractid.WalletBalanceProvider,
    [],
    verify
  );

export const deployStarlayProtocolDataProvider = async (
  addressesProvider: tEthereumAddress,
  verify?: boolean
) =>
  withSaveAndVerify(
    await new StarlayProtocolDataProviderFactory(await getFirstSigner()).deploy(addressesProvider),
    eContractid.StarlayProtocolDataProvider,
    [addressesProvider],
    verify
  );

export const deployMintableERC20 = async (
  args: [string, string, string],
  verify?: boolean
): Promise<MintableERC20> =>
  withSaveAndVerify(
    await new MintableERC20Factory(await getFirstSigner()).deploy(...args),
    eContractid.MintableERC20,
    args,
    verify
  );

export const deployMintableDelegationERC20 = async (
  args: [string, string, string],
  verify?: boolean
): Promise<MintableDelegationERC20> =>
  withSaveAndVerify(
    await new MintableDelegationERC20Factory(await getFirstSigner()).deploy(...args),
    eContractid.MintableDelegationERC20,
    args,
    verify
  );
export const deployDefaultReserveInterestRateStrategy = async (
  args: [tEthereumAddress, string, string, string, string, string, string],
  verify: boolean
) =>
  withSaveAndVerify(
    await new DefaultReserveInterestRateStrategyFactory(await getFirstSigner()).deploy(...args),
    eContractid.DefaultReserveInterestRateStrategy,
    args,
    verify
  );

export const deployStableDebtToken = async (
  args: [tEthereumAddress, tEthereumAddress, tEthereumAddress, string, string],
  verify: boolean
) => {
  const instance = await withSaveAndVerify(
    await new StableDebtTokenFactory(await getFirstSigner()).deploy(),
    eContractid.StableDebtToken,
    [],
    verify
  );

  await instance.initialize(args[0], args[1], args[2], '18', args[3], args[4], '0x10');

  return instance;
};

export const deployVariableDebtToken = async (
  args: [tEthereumAddress, tEthereumAddress, tEthereumAddress, string, string],
  verify: boolean
) => {
  const instance = await withSaveAndVerify(
    await new VariableDebtTokenFactory(await getFirstSigner()).deploy(),
    eContractid.VariableDebtToken,
    [],
    verify
  );

  await instance.initialize(args[0], args[1], args[2], '18', args[3], args[4], '0x10');

  return instance;
};

export const deployGenericStableDebtToken = async (verify?: boolean) =>
  withSaveAndVerify(
    await new StableDebtTokenFactory(await getFirstSigner()).deploy(),
    eContractid.StableDebtToken,
    [],
    verify
  );

export const deployGenericVariableDebtToken = async (verify?: boolean) =>
  withSaveAndVerify(
    await new VariableDebtTokenFactory(await getFirstSigner()).deploy(),
    eContractid.VariableDebtToken,
    [],
    verify
  );

export const deployGenericLToken = async (
  [poolAddress, underlyingAssetAddress, treasuryAddress, incentivesController, name, symbol]: [
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    string,
    string
  ],
  verify: boolean
) => {
  const instance = await withSaveAndVerify(
    await new LTokenFactory(await getFirstSigner()).deploy(),
    eContractid.LToken,
    [],
    verify
  );

  await instance.initialize(
    poolAddress,
    treasuryAddress,
    underlyingAssetAddress,
    incentivesController,
    '18',
    name,
    symbol,
    '0x10'
  );

  return instance;
};

export const deployGenericLTokenImpl = async (verify: boolean) =>
  withSaveAndVerify(
    await new LTokenFactory(await getFirstSigner()).deploy(),
    eContractid.LToken,
    [],
    verify
  );

export const deployDelegationAwareLToken = async (
  [pool, underlyingAssetAddress, treasuryAddress, incentivesController, name, symbol]: [
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    string,
    string
  ],
  verify: boolean
) => {
  const instance = await withSaveAndVerify(
    await new DelegationAwareLTokenFactory(await getFirstSigner()).deploy(),
    eContractid.DelegationAwareLToken,
    [],
    verify
  );

  await instance.initialize(
    pool,
    treasuryAddress,
    underlyingAssetAddress,
    incentivesController,
    '18',
    name,
    symbol,
    '0x10'
  );

  return instance;
};

export const deployDelegationAwareLTokenImpl = async (verify: boolean) =>
  withSaveAndVerify(
    await new DelegationAwareLTokenFactory(await getFirstSigner()).deploy(),
    eContractid.DelegationAwareLToken,
    [],
    verify
  );

export const deployAllMockTokens = async (verify?: boolean) => {
  const tokens: { [symbol: string]: MintableERC20 | WETH9Mocked } = {};

  const protoConfigData = getReservesConfigByPool(StarlayPools.proto);

  for (const tokenSymbol of Object.values(TokenContractId)) {
    if (tokenSymbol === 'WASTR') {
      tokens[tokenSymbol] = await deployWETHMocked();
      await registerContractInJsonDb(tokenSymbol.toUpperCase(), tokens[tokenSymbol]);
      continue;
    }
    let decimals = '18';

    let configData = (<any>protoConfigData)[tokenSymbol];

    tokens[tokenSymbol] = await deployMintableERC20(
      [tokenSymbol, tokenSymbol, configData ? configData.reserveDecimals : decimals],
      verify
    );
    await registerContractInJsonDb(tokenSymbol.toUpperCase(), tokens[tokenSymbol]);
  }
  return tokens;
};

export const deployStableAndVariableTokensHelper = async (
  args: [tEthereumAddress, tEthereumAddress],
  verify?: boolean
) =>
  withSaveAndVerify(
    await new StableAndVariableTokensHelperFactory(await getFirstSigner()).deploy(...args),
    eContractid.StableAndVariableTokensHelper,
    args,
    verify
  );

export const deployLTokensAndRatesHelper = async (
  args: [tEthereumAddress, tEthereumAddress, tEthereumAddress],
  verify?: boolean
) =>
  withSaveAndVerify(
    await new LTokensAndRatesHelperFactory(await getFirstSigner()).deploy(...args),
    eContractid.LTokensAndRatesHelper,
    args,
    verify
  );

export const deployWETHGateway = async (args: [tEthereumAddress], verify?: boolean) =>
  withSaveAndVerify(
    await new WETHGatewayFactory(await getFirstSigner()).deploy(...args),
    eContractid.WETHGateway,
    args,
    verify
  );

export const authorizeWETHGateway = async (
  wethGateWay: tEthereumAddress,
  lendingPool: tEthereumAddress
) =>
  await new WETHGatewayFactory(await getFirstSigner())
    .attach(wethGateWay)
    .authorizeLendingPool(lendingPool);

export const deployMockStableDebtToken = async (
  args: [tEthereumAddress, tEthereumAddress, tEthereumAddress, string, string, string],
  verify?: boolean
) => {
  const instance = await withSaveAndVerify(
    await new MockStableDebtTokenFactory(await getFirstSigner()).deploy(),
    eContractid.MockStableDebtToken,
    [],
    verify
  );

  await instance.initialize(args[0], args[1], args[2], '18', args[3], args[4], args[5]);

  return instance;
};

export const deployWETHMocked = async (verify?: boolean) =>
  withSaveAndVerify(
    await new WETH9MockedFactory(await getFirstSigner()).deploy(),
    eContractid.WASTRMocked,
    [],
    verify
  );

export const deployMockVariableDebtToken = async (
  args: [tEthereumAddress, tEthereumAddress, tEthereumAddress, string, string, string],
  verify?: boolean
) => {
  const instance = await withSaveAndVerify(
    await new MockVariableDebtTokenFactory(await getFirstSigner()).deploy(),
    eContractid.MockVariableDebtToken,
    [],
    verify
  );

  await instance.initialize(args[0], args[1], args[2], '18', args[3], args[4], args[5]);

  return instance;
};

export const deployMockLToken = async (
  args: [
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    string,
    string,
    string
  ],
  verify?: boolean
) => {
  const instance = await withSaveAndVerify(
    await new MockLTokenFactory(await getFirstSigner()).deploy(),
    eContractid.MockLToken,
    [],
    verify
  );

  await instance.initialize(args[0], args[2], args[1], args[3], '18', args[4], args[5], args[6]);

  return instance;
};

export const deploySelfdestructTransferMock = async (verify?: boolean) =>
  withSaveAndVerify(
    await new SelfdestructTransferFactory(await getFirstSigner()).deploy(),
    eContractid.SelfdestructTransferMock,
    [],
    verify
  );

export const chooseLTokenDeployment = (id: eContractid) => {
  switch (id) {
    case eContractid.LToken:
      return deployGenericLTokenImpl;
    case eContractid.DelegationAwareLToken:
      return deployDelegationAwareLTokenImpl;
    default:
      throw Error(`Missing lToken implementation deployment script for: ${id}`);
  }
};

export const deployLTokenImplementations = async (
  pool: ConfigNames,
  reservesConfig: { [key: string]: IReserveParams },
  verify = false
) => {
  const poolConfig = loadPoolConfig(pool);
  const network = <eNetwork>DRE.network.name;

  // Obtain the different LToken implementations of all reserves inside the Market config
  const lTokenImplementations = [
    ...Object.entries(reservesConfig).reduce<Set<eContractid>>((acc, [, entry]) => {
      acc.add(entry.lTokenImpl);
      return acc;
    }, new Set<eContractid>()),
  ];

  for (let x = 0; x < lTokenImplementations.length; x++) {
    const lTokenAddress = getOptionalParamAddressPerNetwork(
      poolConfig[lTokenImplementations[x].toString()],
      network
    );
    if (!notFalsyOrZeroAddress(lTokenAddress)) {
      const deployImplementationMethod = chooseLTokenDeployment(lTokenImplementations[x]);
      console.log(`Deploying implementation`, lTokenImplementations[x]);
      await deployImplementationMethod(verify);
    }
  }

  // Debt tokens, for now all Market configs follows same implementations
  const genericStableDebtTokenAddress = getOptionalParamAddressPerNetwork(
    poolConfig.StableDebtTokenImplementation,
    network
  );
  const geneticVariableDebtTokenAddress = getOptionalParamAddressPerNetwork(
    poolConfig.VariableDebtTokenImplementation,
    network
  );

  if (!notFalsyOrZeroAddress(genericStableDebtTokenAddress)) {
    await deployGenericStableDebtToken(verify);
  }
  if (!notFalsyOrZeroAddress(geneticVariableDebtTokenAddress)) {
    await deployGenericVariableDebtToken(verify);
  }
};

export const deployRateStrategy = async (
  strategyName: string,
  args: [tEthereumAddress, string, string, string, string, string, string],
  verify: boolean
): Promise<tEthereumAddress> => {
  switch (strategyName) {
    default:
      return await (
        await deployDefaultReserveInterestRateStrategy(args, verify)
      ).address;
  }
};

export const deployPriceAggregatorDiaImpl = async (args: [string, string], verify?: boolean) =>
  withSaveAndVerify(
    await new PriceAggregatorAdapterDiaImplFactory(await getFirstSigner()).deploy(args[0], args[1]),
    eContractid.PriceAggregatorAdapterDiaImpl,
    args,
    verify
  );

export const deployMockAggregatorDIA = async (args: [string[], string[]], verify?: boolean) =>
  withSaveAndVerify(
    await new MockAggregatorDIAFactory(await getFirstSigner()).deploy(args[0], args[1]),
    eContractid.MockAggregatorDIA,
    args,
    verify
  );

export const deployStakeUIHelper = async (
  [priceOracle, lay, stakedLay, mockUsd]: [
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress,
    tEthereumAddress
  ],
  verify?: boolean
) => {
  const args = [priceOracle, lay, stakedLay, mockUsd];
  return withSaveAndVerify(
    await new StakeUIHelperFactory(await getFirstSigner()).deploy(
      priceOracle,
      lay,
      stakedLay,
      mockUsd
    ),
    eContractid.StakeUIHelper,
    args,
    verify
  );
};
