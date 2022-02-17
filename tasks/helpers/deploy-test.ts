import { task } from 'hardhat/config';
import { deployMockContract } from '../../helpers/contracts-deployments';

task('deploy-test', 'Deploy mock for dev enviroment')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .setAction(async ({ verify }, localBRE) => {
    await localBRE.run('set-DRE');
    await deployMockContract(verify);
  });
