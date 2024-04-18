import { createAppSlice } from "../../../app/createAppSlice"
import type { CashFlowItem, CashFlowTable, FinancePeriod } from "../types"
import { v4 as uuidv4 } from "uuid"
import { getTodayDate } from "../../../utils"

const initialState: CashFlowTable = [
  {
    id: uuidv4(),
    period_id: "1",
    type: "fixed-payment",
    title: "Аренда квартиры",
    amount: 20000,
    date: getTodayDate(),
  },
]

export const cashFlowSlice = createAppSlice({
  name: "cashflow",
  initialState,
  reducers: create => ({}),
  selectors: {},
})

export const selectCashFlow = state => state.cashflow

export const selectCashFlowById = (state, periodId: FinancePeriod["id"]) => {
  return selectCashFlow(state).filter(
    (cashflow: CashFlowItem) => cashflow.period_id === periodId,
  )
}

export const {} = cashFlowSlice.actions
export const {} = cashFlowSlice.selectors
export default cashFlowSlice.reducer
