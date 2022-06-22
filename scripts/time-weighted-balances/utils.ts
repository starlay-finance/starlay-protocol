import { parse } from 'csv-parse/sync'
import { BigNumber, constants } from 'ethers'
import { readFileSync, writeFileSync } from 'fs'
import { CONFIG } from './config'
import {
  BalanceHistories,
  BalanceHistory,
  TimeWeightedBalance,
  TokenTransfer,
} from './types'

const ZERO = BigNumber.from(0)

const EMPTY: BalanceHistory = {
  blockNumber: 0,
  amount: ZERO,
}

export const EXCLUDE_ADDRESSES = [CONFIG.tokenAddress, constants.AddressZero]

const max = (...nums: BigNumber[]) =>
  nums.reduce((prev, num) => (num.gt(prev) ? num : prev), ZERO)

export const toBalanceHistories = (records: TokenTransfer[]) =>
  records
    .filter(({ Status, Type }) => Status === 'ok' && Type === '')
    .reduce<BalanceHistories>(
      (res, { BlockNumber, FromAddress, ToAddress, TokensTransferred }) => {
        const fromHistories = res[FromAddress] || []
        const fromLast = fromHistories[fromHistories.length - 1] || EMPTY
        fromHistories.push({
          blockNumber: BlockNumber,
          amount: max(fromLast.amount.sub(TokensTransferred)),
        })
        res[FromAddress] = fromHistories

        const toHistories = res[ToAddress] || []
        const toLast = toHistories[toHistories.length - 1] || EMPTY
        toHistories.push({
          blockNumber: BlockNumber,
          amount: toLast.amount.add(TokensTransferred),
        })
        res[ToAddress] = toHistories
        return res
      },
      {},
    )

export const calcTimeWeightedBalance = (
  history: BalanceHistories,
  from: number,
  to: number,
): TimeWeightedBalance =>
  Object.keys(history).reduce((res, key) => {
    return {
      ...res,
      [key]: history[key]?.reduce((bal, { blockNumber, amount }) => {
        if (from > blockNumber) return bal
        if (!bal) return { blockNumber: from, amount }
        if (bal.blockNumber === to) return bal
        const current = Math.min(blockNumber, to)
        const duration = current - bal.blockNumber
        return {
          blockNumber: current,
          amount: bal.amount.add(amount.mul(duration)),
        }
      }),
    }
  }, {})

export const readCsv = <T = any>(fileName: string): T[] => {
  const inputData = readFileSync(`${CONFIG.scriptDir}/input/${fileName}`, {
    encoding: 'utf8',
  })
  return parse(inputData, { columns: true }) as T[]
}

export const writeCsv = (
  fileName: string,
  headers: string[],
  data: string[][],
) => {
  const rows = [headers.join(','), ...data.map((each) => each.join(','))].join(
    '\r',
  )
  writeFileSync(`${CONFIG.scriptDir}/output/${fileName}`, rows)
}
