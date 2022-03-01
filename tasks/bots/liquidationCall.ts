import { LendingPool } from '../../types/LendingPool';
import { task } from 'hardhat/config';
import { getCurrentBlock, getEthersSigners } from '../../helpers/contracts-helpers';
import { eNetwork } from '../../helpers/types';
import { getLendingPool } from '../../helpers/contracts-getters';
import { BigNumber, ethers } from 'ethers';
import { JsonRpcProvider } from '@ethersproject/providers';
import { parseEther } from 'ethers/lib/utils';

task('liquidation-call', 'Liquidation call').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  const signer = getEthersSigners();
  const network = <eNetwork>DRE.network.name;
  const pool = await getLendingPool('0x90384334333f3356eFDD5b20016350843b90f182');
  const users = [...new Set(await getAllBorrowedUsers(pool))];
  console.log('Health Factors');
  const usersVSHealthFactors = {};
  for (let i = 0; i < users.length; i++) {
    const data = await pool.getUserAccountData(users[i]);
    console.log(users[i], data.healthFactor.toString());
    Object.keys(usersVSHealthFactors).push[users[i]] = data.healthFactor;
  }
  const liquidationTarget = Object.entries(usersVSHealthFactors).filter((e) => {
    const factor = e[1] as BigNumber;
    return factor.lt(parseEther('1'));
  });
  console.log('liquidation targets', Object.keys(liquidationTarget));
});

const getAllBorrowedUsers = async (pool: LendingPool) => {
  const provider = new JsonRpcProvider('https://rpc.astar.network:8545');
  const blocksPerRequest = 500;
  let res: string[] = [];
  let from = 508500;
  const current = await getCurrentBlock();
  while (from < current) {
    console.log('get event logs start from:', from);
    const _got = await getLogs(provider, pool.address, from, from + blocksPerRequest);
    if (_got.length != 0) {
      _got.forEach((e) => {
        const log = pool.interface.parseLog(e);
        res.push(log.args[1]);
      });
    }
    from += blocksPerRequest;
  }
  return res;
};

const getLogs = async (provider: JsonRpcProvider, pool: string, from: number, to: number) => {
  return await provider.getLogs({
    address: pool,
    fromBlock: from,
    toBlock: to,
    topics: [ethers.utils.id('Borrow(address,address,address,uint256,uint256,uint256,uint16)')],
  });
};
