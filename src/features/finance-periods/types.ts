export interface FinancePeriod {
  id: string
  user_id: string
  start_date: string
  days_to_new_period?: number
  start_balance: number
  end_balance: number
  stock_start_amount: number
  stock_end_amount: number
  forward_payments_start_amount: number
  forward_payments_end_amount: number
  shortage: number
  stock_compensation: number
  forward_payments_compensation: number
}

export type Periods = FinancePeriod[]

export interface CashFlowItem {
  id: string
  period_id: FinancePeriod["id"]
  type?: "earning" | "fixed-payment" | "variable-payment"
  title: string
  amount: number
  date: string
}

export interface CashFlowTable {
  cashflow: CashFlowItem[]
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}
