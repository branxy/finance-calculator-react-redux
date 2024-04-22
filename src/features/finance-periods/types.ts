export interface FinancePeriod {
  id: string
  user_id: string
  start_date: string
  start_balance: number
  end_balance: number
  stock_start_amount: number
  stock_end_amount: number
  forward_payments_start_amount: number
  forward_payments_end_amount: number
}

export type Periods = FinancePeriod[]

export interface CashflowItem {
  id: string
  period_id: FinancePeriod["id"]
  type?: "earning" | "fixed-payment" | "variable-payment"
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
