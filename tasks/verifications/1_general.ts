import { task } from 'hardhat/config';
import {
  ConfigNames,
  getTreasuryAddress,
  getWrappedNativeTokenAddress,
  loadPoolConfig,
} from '../../helpers/configuration';
import {
  getLendingPoolAddressesProvider,
  getLendingPoolAddressesProviderRegistry,
  getLendingPoolCollateralManagerImpl,
  getLendingPoolConfiguratorImpl,
  getLendingPoolImpl,
  getProxy,
  getStarlayProtocolDataProvider,
  getWalletProvider,
  getWASTRGateway,
} from '../../helpers/contracts-getters';
import { getParamPerNetwork, verifyContract } from '../../helpers/contracts-helpers';
import { notFalsyOrZeroAddress } from '../../helpers/misc-utils';
import { eContractid, eNetwork, ICommonConfiguration } from '../../helpers/types';

task('verify:general', 'Verify contracts at Etherscan')
  .addFlag('all', 'Verify all contracts at Etherscan')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ all, pool }, localDRE) => {
    await localDRE.run('set-DRE');
    const network = localDRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);
    const {
      ReserveAssets,
      ReservesConfig,
      ProviderRegistry,
      MarketId,
      LendingPoolCollateralManager,
      LendingPoolConfigurator,
      LendingPool,
      WastrGateway,
    } = poolConfig as ICommonConfiguration;
    const treasuryAddress = await getTreasuryAddress(poolConfig);

    const registryAddress = getParamPerNetwork(ProviderRegistry, network);
    const addressesProvider = await getLendingPoolAddressesProvider();
    const addressesProviderRegistry = notFalsyOrZeroAddress(registryAddress)
      ? await getLendingPoolAddressesProviderRegistry(registryAddress)
      : await getLendingPoolAddressesProviderRegistry();
    const lendingPoolAddress = await addressesProvider.getLendingPool();
    const lendingPoolConfiguratorAddress = await addressesProvider.getLendingPoolConfigurator(); //getLendingPoolConfiguratorProxy();
    const lendingPoolCollateralManagerAddress =
      await addressesProvider.getLendingPoolCollateralManager();

    const lendingPoolProxy = await getProxy(lendingPoolAddress);
    const lendingPoolConfiguratorProxy = await getProxy(lendingPoolConfiguratorAddress);
    const lendingPoolCollateralManagerProxy = await getProxy(lendingPoolCollateralManagerAddress);

    if (all) {
      const lendingPoolImplAddress = getParamPerNetwork(LendingPool, network);
      const lendingPoolImpl = notFalsyOrZeroAddress(lendingPoolImplAddress)
        ? await getLendingPoolImpl(lendingPoolImplAddress)
        : await getLendingPoolImpl();

      const lendingPoolConfiguratorImplAddress = getParamPerNetwork(
        LendingPoolConfigurator,
        network
      );
      const lendingPoolConfiguratorImpl = notFalsyOrZeroAddress(lendingPoolConfiguratorImplAddress)
        ? await getLendingPoolConfiguratorImpl(lendingPoolConfiguratorImplAddress)
        : await getLendingPoolConfiguratorImpl();

      const lendingPoolCollateralManagerImplAddress = getParamPerNetwork(
        LendingPoolCollateralManager,
        network
      );
      const lendingPoolCollateralManagerImpl = notFalsyOrZeroAddress(
        lendingPoolCollateralManagerImplAddress
      )
        ? await getLendingPoolCollateralManagerImpl(lendingPoolCollateralManagerImplAddress)
        : await getLendingPoolCollateralManagerImpl();

      const dataProvider = await getStarlayProtocolDataProvider();
      const walletProvider = await getWalletProvider();

      const wastrGatewayAddress = getParamPerNetwork(WastrGateway, network);
      const wastrGateway = notFalsyOrZeroAddress(wastrGatewayAddress)
        ? await getWASTRGateway(wastrGatewayAddress)
        : await getWASTRGateway();

      // Address Provider
      console.log('\n- Verifying address provider...\n');
      await verifyContract(eContractid.LendingPoolAddressesProvider, addressesProvider, [MarketId]);

      // Address Provider Registry
      console.log('\n- Verifying address provider registry...\n');
      await verifyContract(
        eContractid.LendingPoolAddressesProviderRegistry,
        addressesProviderRegistry,
        []
      );

      // Lending Pool implementation
      console.log('\n- Verifying LendingPool Implementation...\n');
      await verifyContract(eContractid.LendingPool, lendingPoolImpl, []);

      // Lending Pool Configurator implementation
      console.log('\n- Verifying LendingPool Configurator Implementation...\n');
      await verifyContract(eContractid.LendingPoolConfigurator, lendingPoolConfiguratorImpl, []);

      // Lending Pool Collateral Manager implementation
      console.log('\n- Verifying LendingPool Collateral Manager Implementation...\n');
      await verifyContract(
        eContractid.LendingPoolCollateralManager,
        lendingPoolCollateralManagerImpl,
        []
      );

      // Test helpers
      console.log('\n- Verifying  Starlay  Provider Helpers...\n');
      await verifyContract(eContractid.StarlayProtocolDataProvider, dataProvider, [
        addressesProvider.address,
      ]);

      // Wallet balance provider
      console.log('\n- Verifying  Wallet Balance Provider...\n');
      await verifyContract(eContractid.WalletBalanceProvider, walletProvider, []);

      // WastrGateway
      console.log('\n- Verifying  WastrGateway...\n');
      await verifyContract(eContractid.WASTRGateway, wastrGateway, [
        await getWrappedNativeTokenAddress(poolConfig),
      ]);
    }
    // Lending Pool proxy
    console.log('\n- Verifying  Lending Pool Proxy...\n');
    await verifyContract(eContractid.InitializableAdminUpgradeabilityProxy, lendingPoolProxy, [
      addressesProvider.address,
    ]);

    // LendingPool Conf proxy
    console.log('\n- Verifying  Lending Pool Configurator Proxy...\n');
    await verifyContract(
      eContractid.InitializableAdminUpgradeabilityProxy,
      lendingPoolConfiguratorProxy,
      [addressesProvider.address]
    );

    // Proxy collateral manager
    console.log('\n- Verifying  Lending Pool Collateral Manager Proxy...\n');
    await verifyContract(
      eContractid.InitializableAdminUpgradeabilityProxy,
      lendingPoolCollateralManagerProxy,
      []
    );

    console.log('Finished verifications.');
  });
