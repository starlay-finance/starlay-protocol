import { parse } from 'csv-parse/sync';
import { BigNumber, constants, Contract, providers } from 'ethers';
import { Interface } from 'ethers/lib/utils';
import { readFileSync, writeFileSync } from 'fs';
import { CONFIG } from './config';
import { BalanceHistories, BalanceHistory, TimeWeightedBalance, TokenTransfer } from './types';

const ZERO = BigNumber.from(0);

const EMPTY: BalanceHistory = {
  blockNumber: 0,
  amount: ZERO,
};

export const EXCLUDE_ADDRESSES = [CONFIG.tokenAddress, constants.AddressZero];

const max = (...nums: BigNumber[]) => nums.reduce((prev, num) => (num.gt(prev) ? num : prev), ZERO);
export const sum = (...nums: BigNumber[]) => nums.reduce((prev, num) => num.add(prev), ZERO);

export const toBalanceHistories = (records: TokenTransfer[]) =>
  records
    .filter(({ Status, Type }) => Status === 'ok' && Type === '')
    .reduce<BalanceHistories>((res, { BlockNumber, FromAddress, ToAddress, TokensTransferred }) => {
      const fromHistories = res[FromAddress] || [];
      const fromLast = fromHistories[fromHistories.length - 1] || EMPTY;
      if (fromLast.blockNumber === BlockNumber) {
        fromHistories[fromHistories.length - 1] = {
          blockNumber: BlockNumber,
          amount: fromLast.amount.sub(TokensTransferred),
        };
      } else {
        if (fromLast.amount.isNegative())
          fromHistories[fromHistories.length - 1] = { ...fromLast, amount: ZERO };
        fromHistories.push({
          blockNumber: BlockNumber,
          amount: max(fromLast.amount.sub(TokensTransferred)),
        });
      }
      res[FromAddress] = fromHistories;

      const toHistories = res[ToAddress] || [];
      const toLast = toHistories[toHistories.length - 1] || EMPTY;
      toHistories.push({
        blockNumber: BlockNumber,
        amount: toLast.amount.add(TokensTransferred),
      });
      res[ToAddress] = toHistories;
      return res;
    }, {});

export const calcTimeWeightedBalance = (
  history: BalanceHistories,
  from: number,
  to: number
): TimeWeightedBalance =>
  Object.keys(history).reduce((res, key) => {
    const bal = history[key]?.reduce<
      | {
          blockNumber: number;
          weighted: BigNumber;
          lastBalance: BigNumber;
        }
      | undefined
    >((bal, { blockNumber, amount }) => {
      if (from > blockNumber) return { blockNumber: from, weighted: ZERO, lastBalance: amount };
      if (blockNumber > to) return bal;
      if (!bal) return { blockNumber, weighted: ZERO, lastBalance: amount };
      const current = Math.min(blockNumber, to);
      const duration = current - bal.blockNumber;
      return {
        blockNumber: current,
        weighted: bal.weighted.add(bal.lastBalance.mul(duration)),
        lastBalance: amount,
      };
    }, undefined);
    if (bal && bal.blockNumber < to) {
      bal.weighted = bal.weighted.add(bal.lastBalance.mul(to - bal.blockNumber)) || ZERO;
    }
    return {
      ...res,
      [key]: { amount: bal?.weighted || ZERO },
    };
  }, {});

export const readCsv = <T = any>(fileName: string): T[] => {
  const inputData = readFileSync(`${CONFIG.scriptDir}/input/${fileName}`, {
    encoding: 'utf8',
  });
  return parse(inputData, { columns: true }) as T[];
};

export const writeCsv = (fileName: string, headers: string[], data: string[][]) => {
  const rows = [headers.join(','), ...data.map((each) => each.join(','))].join('\r');
  writeFileSync(`${CONFIG.scriptDir}/output/${fileName}`, rows);
};

const astarBaseAbi = [
  {
    inputs: [{ type: 'address' }],
    name: 'addressMap',
    outputs: [{ type: 'bytes' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
];
const astarBaseAddress = '0x8E2fa5A4D4e4f0581B69aF2f8F2Ef2CF205aE8F0';

const multicallAbi = [
  {
    constant: false,
    inputs: [
      {
        components: [
          { name: 'target', type: 'address' },
          { name: 'callData', type: 'bytes' },
        ],
        name: 'calls',
        type: 'tuple[]',
      },
    ],
    name: 'aggregate',
    outputs: [
      { name: 'blockNumber', type: 'uint256' },
      { name: 'returnData', type: 'bytes[]' },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
const multicallAddress = '0x7D6046156df81EF335E7e765d3bc714960B73207';

export const mapAddresses = async (
  addresses: string[],
  provider: providers.JsonRpcProvider
): Promise<Record<string, string>> => {
  const iContract = new Interface(astarBaseAbi);
  const calls = addresses.map((address) => ({
    target: astarBaseAddress,
    callData: iContract.encodeFunctionData('addressMap', [address]),
  }));

  const { returnData } = await new Contract(
    multicallAddress,
    multicallAbi,
    provider
  ).callStatic.aggregate(calls);

  return returnData.reduce(
    (res, data, index) => ({
      ...res,
      [addresses[index]]: iContract.decodeFunctionResult('addressMap', data)[0],
    }),
    {}
  );
};
