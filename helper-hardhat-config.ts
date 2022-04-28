// @ts-ignore
import { HardhatNetworkForkingUserConfig } from 'hardhat/types';
import { eAstarNetwork, eEthereumNetwork, iParamsPerNetwork } from './helpers/types';

require('dotenv').config();

const INFURA_KEY = process.env.INFURA_KEY || '';
const ALCHEMY_KEY = process.env.ALCHEMY_KEY || '';
const BWARE_LABS_KEY = process.env.BWARE_LABS_KEY || '';
const ONFINALITY_KEY = process.env.ONFINALITY_KEY || '';
const TENDERLY_FORK_ID = process.env.TENDERLY_FORK_ID || '';
const FORK = process.env.FORK || '';
const FORK_BLOCK_NUMBER = process.env.FORK_BLOCK_NUMBER
  ? parseInt(process.env.FORK_BLOCK_NUMBER)
  : 0;

const GWEI = 1000 * 1000 * 1000;

export const buildForkConfig = (): HardhatNetworkForkingUserConfig | undefined => {
  let forkMode;
  if (FORK) {
    forkMode = {
      url: NETWORKS_RPC_URL[FORK],
    };
    if (FORK_BLOCK_NUMBER || BLOCK_TO_FORK[FORK]) {
      forkMode.blockNumber = FORK_BLOCK_NUMBER || BLOCK_TO_FORK[FORK];
    }
  }
  return forkMode;
};

export const NETWORKS_RPC_URL: iParamsPerNetwork<string> = {
  [eEthereumNetwork.coverage]: 'http://localhost:8555',
  [eEthereumNetwork.hardhat]: 'http://localhost:8545',
  [eEthereumNetwork.buidlerevm]: 'http://localhost:8545',
  [eEthereumNetwork.tenderly]: `https://rpc.tenderly.co/fork/`,
  [eAstarNetwork.shibuya]: BWARE_LABS_KEY
    ? `https://shibuya-api.bwarelabs.com/${BWARE_LABS_KEY}`
    : 'https://rpc.shibuya.astar.network:8545',
  [eAstarNetwork.shiden]: BWARE_LABS_KEY
    ? `https://shiden-api.bwarelabs.com/${BWARE_LABS_KEY}`
    : ONFINALITY_KEY
    ? `https://shiden.api.onfinality.io/rpc?apikey=${ONFINALITY_KEY}`
    : 'https://evm.shiden.astar.network',
  [eAstarNetwork.astar]: BWARE_LABS_KEY
    ? `https://astar-api.bwarelabs.com/${BWARE_LABS_KEY}`
    : ONFINALITY_KEY
    ? `https://astar.api.onfinality.io/rpc?apikey=${ONFINALITY_KEY}`
    : 'https://rpc.astar.network:8545',
};

export const NETWORKS_DEFAULT_GAS: iParamsPerNetwork<number> = {
  [eEthereumNetwork.coverage]: 65 * GWEI,
  [eEthereumNetwork.hardhat]: 65 * GWEI,
  [eEthereumNetwork.buidlerevm]: 65 * GWEI,
  [eEthereumNetwork.tenderly]: 1 * GWEI,
  [eAstarNetwork.shibuya]: 3 * GWEI,
  [eAstarNetwork.shiden]: 1 * GWEI,
  [eAstarNetwork.astar]: 1 * GWEI,
};

export const BLOCK_TO_FORK: iParamsPerNetwork<number | undefined> = {
  [eEthereumNetwork.coverage]: undefined,
  [eEthereumNetwork.hardhat]: undefined,
  [eEthereumNetwork.buidlerevm]: undefined,
  [eEthereumNetwork.tenderly]: undefined,
  [eAstarNetwork.shibuya]: undefined,
  [eAstarNetwork.shiden]: undefined,
  [eAstarNetwork.astar]: undefined,
};
