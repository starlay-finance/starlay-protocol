import { BigNumber, providers } from 'ethers';
import { CONFIG } from './config';
import { BalanceHistory, TokenTransfer } from './types';
import {
  calcTimeWeightedBalance,
  EXCLUDE_ADDRESSES,
  mapAddresses,
  readCsv,
  sum,
  toBalanceHistories,
  writeCsv,
} from './utils';

const rewardTotal = BigNumber.from('1500000')
  .mul(10 ** 9)
  .mul(10 ** 9);

const main = async () => {
  const parsedData = readCsv<TokenTransfer>('token_transfers.csv');

  const histories = toBalanceHistories(parsedData);
  writeCsv(
    'balance_histories.csv',
    ['account', 'blockNumber', 'balance'],
    Object.keys(histories)
      .filter((account) => !EXCLUDE_ADDRESSES.includes(account))
      .flatMap((account) =>
        histories[account].map((history) => [
          account,
          `${history.blockNumber}`,
          history.amount.toString(),
        ])
      )
  );

  const from = CONFIG.fromBlockNumber;
  const to = CONFIG.toBlockNumber;
  const timeWeighted = calcTimeWeightedBalance(histories, from, to);
  const timeWeightedAverage: Record<string, BigNumber> = Object.keys(timeWeighted)
    .filter((account) => !EXCLUDE_ADDRESSES.includes(account))
    .reduce(
      (res, account) => ({
        ...res,
        [account]: timeWeighted[account].amount.div(to - from),
      }),
      {}
    );
  const addressDict = await mapAddresses(
    Object.keys(timeWeighted),
    new providers.JsonRpcProvider('https://astar.api.onfinality.io/public')
  );
  const total = CONFIG.filterNullAddress
    ? sum(
        ...Object.keys(timeWeightedAverage)
          .filter((account) => addressDict[account] !== '0x')
          .map((account) => timeWeightedAverage[account])
      )
    : sum(...Object.values(timeWeightedAverage));

  writeCsv(
    'time_weighted_balances.csv',
    ['evm', 'native', 'balance', 'reward'],
    Object.keys(timeWeightedAverage)
      .filter((account) => !EXCLUDE_ADDRESSES.includes(account))
      .map((account) => {
        const twab = timeWeightedAverage[account];
        const reward =
          CONFIG.filterNullAddress && addressDict[account] === '0x'
            ? '0'
            : rewardTotal.mul(twab).div(total).toString();
        if (CONFIG.filterZeroReward && reward === '0') return [];
        return [account, addressDict[account], twab.toString(), reward];
      }).filter(row => !!row.length)
  );
};

main();
