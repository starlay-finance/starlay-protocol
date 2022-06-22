import { BigNumber } from 'ethers'

export type TokenTransfer = {
  BlockNumber: number
  FromAddress: string
  ToAddress: string
  Type: 'IN' | 'OUT' | ''
  TokensTransferred: string
  Status: 'ok' | string
}

export type BalanceHistory = { blockNumber: number; amount: BigNumber }

export type BalanceHistories = Partial<Record<string, BalanceHistory[]>>

export type TimeWeightedBalance = Partial<Record<string, BalanceHistory>>
