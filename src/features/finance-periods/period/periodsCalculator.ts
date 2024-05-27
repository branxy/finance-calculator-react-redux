import type { Cashflow, CashflowItem, FinancePeriod, Periods } from "../types"
import { type CompensationAmount } from "./periodsSlice"

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

interface CompensationToUpdate {
  id: FinancePeriod["id"]
  changes: {
    stock: CashflowItem["amount"]
    forward_payments: CashflowItem["amount"]
  }
  // savingType: "income/stock" | "income/forward-payment"
}

type CompensationsToUpdate = CompensationToUpdate[]

interface PaymentSubmittedSingle {
  id: FinancePeriod["id"]
  changes: {
    start_balance: FinancePeriod["start_balance"]
    end_balance: FinancePeriod["end_balance"]
    stock: FinancePeriod["stock"]
    forward_payments: FinancePeriod["forward_payments"]
  }
}

export type PaymentSubmittedUpdates = PaymentSubmittedSingle[]

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

export function getPeriodsOnEndBalanceChange(
  periods: Periods,
  currentPeriodIndex: number,
  periodId: CashflowItem["period_id"],
  whatChanged: "income" | "payment",
  difference: number,
) {
  const valuesToUpdate: ValuesToUpdate = []

  for (let i = currentPeriodIndex; i < periods.length; i++) {
    const p = periods[i]
    const isPayment = whatChanged === "payment"
    const sign = isPayment ? -1 : 1

    let newStartBalanceForPeriod = p.start_balance + sign * difference
    const newEndBalanceForPeriod = p.end_balance + sign * difference

    if (p.id === periodId) {
      newStartBalanceForPeriod = p.start_balance
    }

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

export function getPeriodsOnPaymentAddedFromCashflow(
  periods: Periods,
  currentPeriodIndex: number,
  currentPeriodId: FinancePeriod["id"],
  paymentAmount: CashflowItem["amount"],
) {
  const valuesToUpdate: ValuesToUpdate = []

  for (let i = currentPeriodIndex; i < periods.length; i++) {
    const p = periods[i]
    let newStartBalanceForPeriod = p.start_balance - paymentAmount
    const newEndBalanceForPeriod = p.end_balance - paymentAmount

    if (p.id === currentPeriodId) {
      newStartBalanceForPeriod = p.start_balance
    }

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

export function getPeriodsOnIncomeAddedFromCashflow(
  periods: Periods,
  currentPeriodIndex: number,
  currentPeriodId: FinancePeriod["id"],
  incomeAmount: CashflowItem["amount"],
) {
  const valuesToUpdate: ValuesToUpdate = []

  for (let i = currentPeriodIndex; i < periods.length; i++) {
    const p = periods[i]
    let newStartBalanceForPeriod = p.start_balance + incomeAmount
    const newEndBalanceForPeriod = p.end_balance + incomeAmount

    if (p.id === currentPeriodId) {
      newStartBalanceForPeriod = p.start_balance
    }

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

export function getPeriodsOnSavingsAddedFromCashflow(
  periods: Periods,
  currentPeriodIndex: number,
  savingType: "income/stock" | "income/forward-payment",
  savingAmount: CashflowItem["amount"],
) {
  const valuesToUpdate: CompensationsToUpdate = []

  for (let i = currentPeriodIndex; i < periods.length; i++) {
    const p = periods[i]
    let newStockStartAmount = p.stock
    let newFPStartAmount = p.forward_payments

    if (savingType === "income/stock") {
      newStockStartAmount = p.stock + savingAmount
    } else if (savingType === "income/forward-payment") {
      newFPStartAmount = p.forward_payments + savingAmount
    }

    valuesToUpdate.push({
      id: p.id,
      changes: {
        stock: newStockStartAmount,
        forward_payments: newFPStartAmount,
      },
    })
  }

  return valuesToUpdate
}

export function getPeriodsOnCompensationSubmittedFromCashflow(
  periods: Periods,
  currentPeriodIndex: number,
  compensationSum: number,
  compensationAmount: CompensationAmount,
) {
  const valuesToUpdate: PaymentSubmittedUpdates = []

  for (let i = currentPeriodIndex; i < periods.length; i++) {
    const p = periods[i]
    let newStartBalance = p.start_balance + compensationSum
    const newEndBalance = p.end_balance + compensationSum,
      newStockStart = p.stock - compensationAmount.stock,
      newFPStart = p.forward_payments - compensationAmount.fp

    if (i === currentPeriodIndex) {
      newStartBalance = p.start_balance
    }

    valuesToUpdate.push({
      id: p.id,
      changes: {
        start_balance: newStartBalance,
        end_balance: newEndBalance,
        stock: newStockStart,
        forward_payments: newFPStart,
      },
    })
  }

  return valuesToUpdate
}
