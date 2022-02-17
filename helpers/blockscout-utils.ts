import axios from 'axios';
import { Contract } from 'ethers/lib/ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DRE } from './misc-utils';
import { eAstarNetwork } from './types';

const TASK_FLATTEN_GET_FLATTENED_SOURCE = 'flatten:get-flattened-sources';
const TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS = 'compile:solidity:get-source-paths';

export const useVerify = () =>
  DRE && Object.keys(eAstarNetwork).includes((DRE as HardhatRuntimeEnvironment).network.name);

const SOLIDITY_PRAGMA = 'pragma solidity';
const LICENSE_IDENTIFIER = 'License-Identifier';
const EXPERIMENTAL_ABIENCODER = 'pragma experimental ABIEncoderV2;';

const encodeDeployParams = (instance: Contract, args: (string | string[])[]) => {
  return instance.interface.encodeDeploy(args).replace('0x', '');
};

// Remove lines at "text" that includes "matcher" string, but keeping first "keep" lines
const removeLines = (text: string, matcher: string, keep = 0): string => {
  let counter = keep;
  return text
    .split('\n')
    .filter((line) => {
      const match = !line.includes(matcher);
      if (match === false && counter > 0) {
        counter--;
        return true;
      }
      return match;
    })
    .join('\n');
};

// Try to find the path of a Contract by name of the file without ".sol"
const findPath = async (id: string): Promise<string> => {
  const paths = await DRE.run(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS);
  const path = paths.find((x) => {
    const t = x.split('/');
    return t[t.length - 1].split('.')[0] == id;
  });

  if (!path) {
    throw Error('Missing path for contract name: ${id}');
  }

  return path;
};

// Hardhat Flattener, similar to truffle flattener
const hardhatFlattener = async (filePath: string) =>
  await DRE.run(TASK_FLATTEN_GET_FLATTENED_SOURCE, { files: [filePath] });

export const verifyAtBlockscout = async (
  id: string,
  instance: Contract,
  args: (string | string[])[]
) => {
  const network = (DRE as HardhatRuntimeEnvironment).network.name;
  const filePath = await findPath(id);
  const encodedConstructorParams = encodeDeployParams(instance, args);
  const flattenSourceCode = await hardhatFlattener(filePath);

  // Remove pragmas and license identifier after first match, required by block explorers like explorer-mainnet.maticgivil.com or Etherscan
  const cleanedSourceCode = removeLines(
    removeLines(removeLines(flattenSourceCode, LICENSE_IDENTIFIER, 1), SOLIDITY_PRAGMA, 1),
    EXPERIMENTAL_ABIENCODER,
    1
  );
  try {
    console.log(
      `[Blockscout Verify] Verifying ${id} with address ${instance.address} at ${network} network`
    );
    console.log(`https://blockscout.com/${network}/api`);
    const response = await axios.post(
      `https://blockscout.com/${network}/api`,
      {
        addressHash: instance.address,
        name: id,
        compilerVersion: 'v0.6.12+commit.27d51765',
        optimization: 'true',
        contractSourceCode: cleanedSourceCode,
        constructorArguments: encodedConstructorParams,
        evmVersion: 'istanbul',
      },
      {
        params: {
          module: 'contract',
          action: 'verify',
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    if (response.status === 200 && response.data.message === 'OK') {
      console.log(`[Blockscout Verify] Verified contract at ${network} network.`);
      console.log(
        `[Blockscout Verify] Check at: https://blockscout.com/${network}/address/${instance.address}/contracts) \n`
      );
      return;
    }

    throw Error(JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    if (error?.message.includes('Smart-contract already verified.')) {
      console.log(
        `[Blockscout Verify] Already verified. Check it at: https://blockscout.com/${network}/address/${instance.address}/contracts) \n`
      );
      return;
    }
    console.error('[Blockscout Verify] Error:', error.toString());
    console.log(
      `[Blockscout Verify] Skipping verification for ${id} with ${instance.address} due an unknown error.`
    );
    console.log(
      `Please proceed with manual verification at https://blockscout.com/${network}/address/${instance.address}/contracts`
    );
    console.log(`- Use the following as encoded constructor params`);
    console.log(encodedConstructorParams);
    console.log(`- Flattened and cleaned source code`);
    console.log(cleanedSourceCode);
  }
};
