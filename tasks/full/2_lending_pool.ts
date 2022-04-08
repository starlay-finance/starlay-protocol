import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ConfigNames, loadPoolConfig } from '../../helpers/configuration';
import {
  deployLendingPool,
  deployLendingPoolConfigurator,
  deployLTokenImplementations,
  deployLTokensAndRatesHelper,
  deployStableAndVariableTokensHelper,
} from '../../helpers/contracts-deployments';
import {
  getLendingPool,
  getLendingPoolAddressesProvider,
  getLendingPoolConfiguratorProxy,
} from '../../helpers/contracts-getters';
import { getParamPerNetwork, insertContractAddressInDb } from '../../helpers/contracts-helpers';
import { notFalsyOrZeroAddress, waitForTx } from '../../helpers/misc-utils';
import { eContractid, eNetwork } from '../../helpers/types';

task('full:deploy-lending-pool', 'Deploy lending pool for dev enviroment')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, DRE: HardhatRuntimeEnvironment) => {
    try {
      await DRE.run('set-DRE');
      const network = <eNetwork>DRE.network.name;
      const poolConfig = loadPoolConfig(pool);
      const addressesProvider = await getLendingPoolAddressesProvider();

      const { LendingPool, LendingPoolConfigurator } = poolConfig;

      // Reuse/deploy lending pool implementation
      let lendingPoolImplAddress = getParamPerNetwork(LendingPool, network);
      if (!notFalsyOrZeroAddress(lendingPoolImplAddress)) {
        console.log('\tDeploying new lending pool implementation & libraries...');
        const lendingPoolImpl = await deployLendingPool(verify);
        lendingPoolImplAddress = lendingPoolImpl.address;
        await lendingPoolImpl.initialize(addressesProvider.address);
      }
      console.log('\tSetting lending pool implementation with address:', lendingPoolImplAddress);
      // Set lending pool impl to Address provider
      await waitForTx(await addressesProvider.setLendingPoolImpl(lendingPoolImplAddress));

      const address = await addressesProvider.getLendingPool();
      const lendingPoolProxy = await getLendingPool(address);

      await insertContractAddressInDb(eContractid.LendingPool, lendingPoolProxy.address);

      // Reuse/deploy lending pool configurator
      let lendingPoolConfiguratorImplAddress = getParamPerNetwork(LendingPoolConfigurator, network); //await deployLendingPoolConfigurator(verify);
      if (!notFalsyOrZeroAddress(lendingPoolConfiguratorImplAddress)) {
        console.log('\tDeploying new configurator implementation...');
        const lendingPoolConfiguratorImpl = await deployLendingPoolConfigurator(verify);
        lendingPoolConfiguratorImplAddress = lendingPoolConfiguratorImpl.address;
      }
      if (!notFalsyOrZeroAddress(lendingPoolProxy.address)) {
        throw new Error('missing lendingPoolProxy');
      }
      console.log(
        '\tSetting lending pool configurator implementation with address:',
        lendingPoolConfiguratorImplAddress
      );
      // Set lending pool conf impl to Address Provider
      await waitForTx(
        await addressesProvider.setLendingPoolConfiguratorImpl(lendingPoolConfiguratorImplAddress)
      );

      const lendingPoolConfiguratorProxy = await getLendingPoolConfiguratorProxy(
        await addressesProvider.getLendingPoolConfigurator()
      );

      await insertContractAddressInDb(
        eContractid.LendingPoolConfigurator,
        lendingPoolConfiguratorProxy.address
      );

      // Deploy deployment helpers
      await deployStableAndVariableTokensHelper(
        [lendingPoolProxy.address, addressesProvider.address],
        verify
      );
      await deployLTokensAndRatesHelper(
        [lendingPoolProxy.address, addressesProvider.address, lendingPoolConfiguratorProxy.address],
        verify
      );
      await deployLTokenImplementations(pool, poolConfig.ReservesConfig, verify);
    } catch (error) {
      if (DRE.network.name.includes('tenderly')) {
        const transactionLink = `https://dashboard.tenderly.co/${DRE.config.tenderly.username}/${
          DRE.config.tenderly.project
        }/fork/${DRE.tenderly.network().getFork()}/simulation/${DRE.tenderly.network().getHead()}`;
        console.error('Check tx error:', transactionLink);
      }
      throw error;
    }
  });
