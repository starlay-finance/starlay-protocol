import { waitForTx } from './../../helpers/misc-utils';
import { getLTokenExtraParams } from './../../helpers/init-helpers';
import { formatEther } from 'ethers/lib/utils';
import { task } from 'hardhat/config';
import { ConfigNames, loadPoolConfig } from '../../helpers/configuration';
import {
  getFirstSigner,
  getLendingPool,
  getLendingPoolAddressesProvider,
  getLendingPoolConfiguratorProxy,
} from '../../helpers/contracts-getters';
import { getEthersSigners, getParamPerNetwork } from '../../helpers/contracts-helpers';
import { eNetwork } from '../../helpers/types';

task('pause-lending-pool', 'Pause lending pool')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addFlag(
    'stop',
    `Whether the lending pool should be stopped or not. if specified false, start lending pool`
  )

  .setAction(async ({ pool, stop }, DRE) => {
    console.log('prior dre');
    await DRE.run('set-DRE');
    const { LendingPool, LendingPoolConfigurator } = loadPoolConfig(pool);
    const network = <eNetwork>DRE.network.name;
    const lendingPool = getParamPerNetwork(LendingPool, network);
    const configurator = getParamPerNetwork(LendingPoolConfigurator, network);
    const emergencyAdmin = (await getEthersSigners())[1];

    console.log(
      'emergencyAdmin:',
      await emergencyAdmin.getAddress(),
      formatEther(await emergencyAdmin.getBalance())
    );

    const configuratorInstance = await getLendingPoolConfiguratorProxy(configurator);
    await waitForTx(await configuratorInstance.connect(emergencyAdmin).setPoolPause(stop));
    const lendingPoolInstance = await getLendingPool(lendingPool);

    console.log('Lending pool pause current:', await lendingPoolInstance.paused());
  });
