import { CONFIG } from './config'
import { TokenTransfer } from './types'
import {
  calcTimeWeightedBalance,
  EXCLUDE_ADDRESSES,
  readCsv,
  toBalanceHistories,
  writeCsv,
} from './utils'

const main = () => {
  const parsedData = readCsv<TokenTransfer>('token_transfers.csv')

  const histories = toBalanceHistories(parsedData)
  writeCsv(
    'balance_histories.csv',
    ['account', 'blockNumber', 'balance'],
    Object.keys(histories)
      .filter((account) => !EXCLUDE_ADDRESSES.includes(account))
      .flatMap((account) =>
        histories[account]!.map((history) => [
          account,
          `${history.blockNumber}`,
          history.amount.toString(),
        ]),
      ),
  )

  const from = CONFIG.fromBlockNumber
  const to = CONFIG.toBlockNumber
  const timeWeighted = calcTimeWeightedBalance(histories, from, to)
  writeCsv(
    'time_weighted_balances.csv',
    ['account', 'balance'],
    Object.keys(timeWeighted)
      .filter((account) => !EXCLUDE_ADDRESSES.includes(account))
      .map((account) => [
        account,
        timeWeighted[account]!.amount.div(to - from).toString(),
      ]),
  )
}

main()
