import { task } from 'hardhat/config';
import { getStarlayProtocolDataProvider } from '../../helpers/contracts-getters';

task('print-config:fork', 'Deploy development enviroment')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .setAction(async ({ verify }, DRE) => {
    await DRE.run('set-DRE');
    await DRE.run('starlay:astar');

    const dataProvider = await getStarlayProtocolDataProvider();
    await DRE.run('print-config', { dataProvider: dataProvider.address, pool: 'Starlay' });
  });
