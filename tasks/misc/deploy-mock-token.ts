import { task } from 'hardhat/config';
import { deployMintableERC20 } from '../../helpers/contracts-deployments';
import { registerContractInJsonDb, verifyContract } from '../../helpers/contracts-helpers';
import { TokenContractId } from '../../helpers/types';
import { BigNumber } from 'ethers';
import { getFirstSigner } from '../../helpers/contracts-getters';

const deployMockTokenAndRecordJson = async ({
  key,
  name,
  symbol,
  decimals,
}: {
  key: typeof TokenContractId[number];
  name: string;
  symbol: string;
  decimals: string;
}) => {
  const instance = await deployMintableERC20([name, symbol, decimals], true);
  await registerContractInJsonDb(key.toUpperCase(), instance);
  return instance;
};

// // ref: https://blockscout.com/astar/token/0xdd90E5E87A2081Dcf0391920868eBc2FFB81a1aF/token-transfers
// task(
//   "dev:deploy-mock-token:matic",
//   "dev:deploy-mock-token:matic"
// ).setAction(async ({}, localBRE) => {
//   await localBRE.run('set-DRE');

//   await deployMockTokenAndRecordJson({
//     key: "MATIC",
//     name: "Matic Token",
//     symbol: "MATIC",
//     decimals: "18"
//   })
// })

// // ref: https://blockscout.com/astar/token/0x7f27352D5F83Db87a5A3E00f4B07Cc2138D8ee52/token-transfers
// task(
//   "dev:deploy-mock-token:bnb",
//   "dev:deploy-mock-token:bnb"
// ).setAction(async ({}, localBRE) => {
//   await localBRE.run('set-DRE');

//   await deployMockTokenAndRecordJson({
//     key: "BNB",
//     name: "Binance Coin",
//     symbol: "BNB",
//     decimals: "18"
//   })
// })

task('dev:deploy-mock-token:usdc', 'dev:deploy-mock-token:usdc').setAction(async ({}, localBRE) => {
  await localBRE.run('set-DRE');
  const signer = await getFirstSigner();
  const balance = await signer.getBalance();
  console.log('balance=>', balance.toString());

  const token = await deployMockTokenAndRecordJson({
    key: 'USDC',
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: '6',
  });

  await token.mint(BigNumber.from(1000000).mul(BigNumber.from(1000000)));
});
