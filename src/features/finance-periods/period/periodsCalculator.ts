import type { Cashflow, FinancePeriod, Periods } from "../types"

export interface SumOfTransactionsByType {
  income: number
  outcome: number
  stockIncome: number
  stockSpent: number
  forwardPaymentsIncome: number
  forwardPaymentsSpent: number
}

export interface SinglePeriodChanges {
  id: FinancePeriod["id"]
  changes: {
    start_balance: FinancePeriod["start_balance"]
    end_balance: FinancePeriod["end_balance"]
    stock: FinancePeriod["stock"]
    forward_payments: FinancePeriod["forward_payments"]
  }
}

export type PeriodsChanges = SinglePeriodChanges[]

interface ValueToUpdate {
  id: FinancePeriod["id"]
  changes: {
    start_balance: FinancePeriod["start_balance"]
    end_balance: FinancePeriod["end_balance"]
  }
}

export type ValuesToUpdate = ValueToUpdate[]

export function getSumOfTransactionsByType(
  transactions: Cashflow,
): SumOfTransactionsByType {
  const sumOfTransactions: SumOfTransactionsByType = {
    income: 0,
    outcome: 0,
    stockIncome: 0,
    stockSpent: 0,
    forwardPaymentsIncome: 0,
    forwardPaymentsSpent: 0,
  }

  for (const transaction of transactions) {
    const { amount } = transaction
    switch (transaction.type) {
      case "income/profit":
        sumOfTransactions.income += amount
        break
      case "income/stock":
        sumOfTransactions.stockIncome += amount
        break
      case "income/forward-payment":
        sumOfTransactions.forwardPaymentsIncome += amount
        break
      case "payment/fixed":
      case "payment/variable":
        sumOfTransactions.outcome += amount
        break
      case "compensation/stock":
        sumOfTransactions.stockSpent += amount
        break
      case "compensation/forward-payment":
        sumOfTransactions.forwardPaymentsSpent += amount
        break
      default:
        throw new Error(`Unknown type of transaction: ${transaction.type}`)
    }
  }

  return sumOfTransactions
}

export function getPeriodsChangesOnTransactionsDelete(
  periods: Periods,
  startIndex: number,
  sumOfTransactions: SumOfTransactionsByType,
  currentPeriodWasDeleted: boolean,
): PeriodsChanges {
  const valuesToUpdate: PeriodsChanges = []

  for (let i = startIndex; i < periods.length; i++) {
    const p = periods[i]

    const {
      income,
      outcome,
      stockIncome,
      stockSpent,
      forwardPaymentsIncome,
      forwardPaymentsSpent,
    } = sumOfTransactions

    const spentSavings = stockSpent + forwardPaymentsSpent

    let newStartBalanceForPeriod = p.start_balance - income + outcome
    const newEndBalanceForPeriod =
        p.end_balance - spentSavings - income + outcome,
      newStock = p.stock - stockIncome + stockSpent,
      newFP = p.forward_payments - forwardPaymentsIncome + forwardPaymentsSpent

    const currentPeriod = i === startIndex
    // 1. if it's current period, don't update start_balance
    if (currentPeriod && !currentPeriodWasDeleted) {
      newStartBalanceForPeriod = p.start_balance
    }

    valuesToUpdate.push({
      id: p.id,
      changes: {
        start_balance: newStartBalanceForPeriod,
        end_balance: newEndBalanceForPeriod,
        stock: newStock,
        forward_payments: newFP,
      },
    })
  }

  return valuesToUpdate
}

export function getPeriodsOnStartBalanceChange(
  periods: Periods,
  currentPeriodIndex: number,
  balanceDifference: number,
): ValuesToUpdate {
  const valuesToUpdate: ValuesToUpdate = []

  for (let i = currentPeriodIndex; i < periods.length; i++) {
    const p = periods[i]
    const newStartBalanceForPeriod = p.start_balance - balanceDifference
    const newEndBalanceForPeriod = p.end_balance - balanceDifference

    valuesToUpdate.push({
      id: p.id,
      changes: {
        start_balance: newStartBalanceForPeriod,
        end_balance: newEndBalanceForPeriod,
      },
    })
  }

  return valuesToUpdate
}
