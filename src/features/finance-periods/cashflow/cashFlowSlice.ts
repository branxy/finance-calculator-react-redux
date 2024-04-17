import { createAppSlice } from "../../../app/createAppSlice"
import { type CashFlow } from "../types"
import { v4 as uuidv4 } from "uuid"

const initialState: CashFlow = {
  periodId: "1",
  earnings: [],
  payments: {
    fixed: [],
    variable: [],
  },
}

export const cashFlowSlice = createAppSlice({
  name: "cashflow",
  initialState,
  reducers: create => ({}),
  selectors: {
    selectEarnings: cashflow => cashflow.earnings,
    selectPayments: cashflow => cashflow.payments,
  },
})

export const {} = cashFlowSlice.actions
export const { selectEarnings, selectPayments } = cashFlowSlice.selectors
export default cashFlowSlice.reducer
