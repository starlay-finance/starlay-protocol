import { task } from 'hardhat/config';
import {
  ConfigNames,
  getWrappedNativeTokenAddress,
  loadPoolConfig,
} from '../../helpers/configuration';
import { deployWASTRGateway } from '../../helpers/contracts-deployments';

const CONTRACT_NAME = 'WASTRGateway';

task(`full-deploy-wastr-gateway`, `Deploys the ${CONTRACT_NAME} contract`)
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .addFlag('verify', `Verify ${CONTRACT_NAME} contract via Etherscan API.`)
  .setAction(async ({ verify, pool }, localBRE) => {
    await localBRE.run('set-DRE');
    const poolConfig = loadPoolConfig(pool);
    const Weth = await getWrappedNativeTokenAddress(poolConfig);

    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }
    const wastrGateWay = await deployWASTRGateway([Weth], verify);
    console.log(`${CONTRACT_NAME}.address`, wastrGateWay.address);
    console.log(`\tFinished ${CONTRACT_NAME} deployment`);
  });
