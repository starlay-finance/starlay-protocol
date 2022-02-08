import { task } from 'hardhat/config';
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
import { insertContractAddressInDb } from '../../helpers/contracts-helpers';
import { waitForTx } from '../../helpers/misc-utils';
import { eContractid } from '../../helpers/types';

task('dev:deploy-lending-pool', 'Deploy lending pool for dev enviroment')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, localBRE) => {
    await localBRE.run('set-DRE');
    const addressesProvider = await getLendingPoolAddressesProvider();
    const poolConfig = loadPoolConfig(pool);

    const lendingPoolImpl = await deployLendingPool(verify);

    // Set lending pool impl to Address Provider
    await waitForTx(await addressesProvider.setLendingPoolImpl(lendingPoolImpl.address));

    const address = await addressesProvider.getLendingPool();
    const lendingPoolProxy = await getLendingPool(address);

    await insertContractAddressInDb(eContractid.LendingPool, lendingPoolProxy.address);

    const lendingPoolConfiguratorImpl = await deployLendingPoolConfigurator(verify);

    // Set lending pool conf impl to Address Provider
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
    await deployStableAndVariableTokensHelper(
      [lendingPoolProxy.address, addressesProvider.address],
      verify
    );
    await deployLTokensAndRatesHelper(
      [lendingPoolProxy.address, addressesProvider.address, lendingPoolConfiguratorProxy.address],
      verify
    );
    await deployLTokenImplementations(pool, poolConfig.ReservesConfig, verify);
  });
