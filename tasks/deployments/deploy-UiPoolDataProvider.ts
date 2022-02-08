import { task } from 'hardhat/config';
import { exit } from 'process';
import { ZERO_ADDRESS } from '../../helpers/constants';
import { deployUiPoolDataProvider } from '../../helpers/contracts-deployments';
import { eAstarNetwork, eContractid, eEthereumNetwork } from '../../helpers/types';

task(`deploy-${eContractid.UiPoolDataProvider}`, `Deploys the UiPoolDataProvider contract`)
  .addFlag('verify', 'Verify UiPoolDataProvider contract via Etherscan API.')
  .setAction(async ({ verify }, localBRE) => {
    await localBRE.run('set-DRE');
    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }
    const network = localBRE.network.name;

    const addressesByNetwork: {
      [key: string]: { incentivesController: string; starlayOracle: string };
    } = {
      [eEthereumNetwork.kovan]: {
        incentivesController: '0x0000000000000000000000000000000000000000',
        starlayOracle: '0x8fb777d67e9945e2c01936e319057f9d41d559e6',
      },
      [eEthereumNetwork.main]: {
        incentivesController: '0xd784927Ff2f95ba542BfC824c8a8a98F3495f6b5',
        starlayOracle: '0xa50ba011c48153de246e5192c8f9258a2ba79ca9',
      },
      [eAstarNetwork.shibuya]: {
        incentivesController: ZERO_ADDRESS, // TODO: only for v1
        starlayOracle: ZERO_ADDRESS, //TODO: only for v1
      },
    };
    const supportedNetworks = Object.keys(addressesByNetwork);

    if (!supportedNetworks.includes(network)) {
      console.error(
        `[task][error] Network "${network}" not supported, please use one of: ${supportedNetworks.join()}`
      );
      exit(2);
    }

    const oracle = addressesByNetwork[network].starlayOracle;
    const incentivesController = addressesByNetwork[network].incentivesController;

    console.log(`\n- UiPoolDataProvider deployment`);

    const uiPoolDataProvider = await deployUiPoolDataProvider(
      [incentivesController, oracle],
      verify
    );

    console.log('UiPoolDataProvider deployed at:', uiPoolDataProvider.address);
    console.log(`\tFinished UiPoolDataProvider deployment`);
  });
