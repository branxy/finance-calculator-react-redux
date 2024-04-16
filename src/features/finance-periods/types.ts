export interface FinancePeriod {
  id: string
  startDate: string
  daysToNewPeriod: number | undefined
  balance: Balance
  shortage: number
  savings: Savings
  compensation: Compensation
}

interface Balance {
  startBalance: number
  endBalance: number
}

interface Savings {
  stock: {
    startAmount: number
    endAmount: number
  }
  forwardPayments: {
    startAmount: number
    endAmount: number
  }
}

interface Compensation {
  stock: number
  forwardPayments: number
}

export interface CashFlow {
  periodId: FinancePeriod["id"]
  earnings: CashFlowItem[]
  payments: {
    fixed: CashFlowItem[]
    variable: CashFlowItem[]
  }
}

export interface CashFlowItem {
  id: string
  title: string
  amount: number
  date: string
}

export type Periods = FinancePeriod[]
