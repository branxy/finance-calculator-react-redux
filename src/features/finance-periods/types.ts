export interface FinancePeriod {
  id: string
  user_id: string
  start_date: string
  start_balance: number
  end_balance: number
  stock: number
  forward_payments: number
}

export type Periods = FinancePeriod[]

export interface CashflowItem {
  id: string
  period_id: FinancePeriod["id"]
  type?:
    | "income/profit"
    | "income/stock"
    | "income/forward-payment"
    | "payment/fixed"
    | "payment/variable"
    | "compensation/stock"
    | "compensation/forward-payment"
  title: string
  amount: number
  date: string
}

export type Cashflow = CashflowItem[]

export interface CashFlowTable {
  cashflow: Cashflow
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

export interface StockCompensation {
  id: CashflowItem["id"]
  period_id: CashflowItem["period_id"]
  type: "income/stock"
  title: CashflowItem["title"]
  amount: CashflowItem["amount"]
  date: CashflowItem["date"]
}

export type StockCompensations = StockCompensation[]

export interface FPCompensation {
  id: CashflowItem["id"]
  period_id: CashflowItem["period_id"]
  type: "income/forward-payment"
  title: CashflowItem["title"]
  amount: CashflowItem["amount"]
  date: CashflowItem["date"]
}

export type FPCompensations = FPCompensation[]
