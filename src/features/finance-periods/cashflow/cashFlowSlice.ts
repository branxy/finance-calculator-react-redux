import { createAppSlice } from "../../../app/createAppSlice"
import type { CashFlowItem, CashFlowTable, FinancePeriod } from "../types"
import { v4 as uuidv4 } from "uuid"
import { getTodayDate } from "../../../utils"
import { PayloadAction } from "@reduxjs/toolkit"
import { type RootState } from "../../../app/store"
import { uploadFixedPayment } from "../api/cashflowApi"

const initialState: CashFlowTable = {
  cashflow: [
    {
      id: uuidv4(),
      period_id: "1",
      type: "fixed-payment",
      title: "Аренда квартиры",
      amount: 20000,
      date: getTodayDate(),
    },
  ],
  status: "idle",
  error: null,
}

export const cashflowSlice = createAppSlice({
  name: "cashflow",
  initialState,
  reducers: create => ({
    addFixedPayment: create.asyncThunk(
      async (newPayment: CashFlowItem) => {
        const receivedNewPayment = await uploadFixedPayment(newPayment)
        return { newPayment: receivedNewPayment }
      },
      {
        pending: state => {
          state.status = "loading"
        },
        rejected: (state, action) => {
          state.status = "failed"
        },
        fulfilled: (state, action) => {
          state.status = "succeeded"
          // here a periodsSlice extraReducer should intercept the dispatch call and recalculate current period start_balance, end_balance and shortage. Then recalculate future periods' start_balance, end_balance and shortage.

          // add new fixed payment to state
          state.cashflow.push(action.payload.newPayment)
        },
      },
    ),
  }),
  selectors: {},
})

export const selectCashFlow = (state: RootState) => state.cashflow.cashflow

export const selectCashFlowById = (
  state: RootState,
  periodId: FinancePeriod["id"],
) => {
  return selectCashFlow(state).filter(
    (cashflow: CashFlowItem) => cashflow.period_id === periodId,
  )
}

export const { addFixedPayment } = cashflowSlice.actions
export const {} = cashflowSlice.selectors
export default cashflowSlice.reducer
