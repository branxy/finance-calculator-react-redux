import { createAppSlice } from "../../../app/createAppSlice"
import type { CashflowItem, CashFlowTable, FinancePeriod } from "../types"
import { v4 as uuidv4 } from "uuid"
import { getTodayDate } from "../../../utils"
import { PayloadAction } from "@reduxjs/toolkit"
import { type RootState } from "../../../app/store"
import { uploadPayment } from "../api/cashflowApi"
import { createAppSelector } from "../../../app/hooks"
import { paymentSubmitted } from "../periodsSlice"
import {
  type EarningsT,
  type FixedPaymentsT,
  type VariablePaymentsT,
} from "./Forecast"

const sampleCashflowItem = {
  id: uuidv4(),
  period_id: "1",
  type: "fixed-payment",
  title: "Аренда квартиры",
  amount: 20000,
  date: getTodayDate(),
}

const initialState: CashFlowTable = {
  cashflow: [],
  status: "idle",
  error: null,
}

export const cashflowSlice = createAppSlice({
  name: "cashflow",
  initialState,
  reducers: create => ({
    addedPayment: create.asyncThunk(
      async (newPayment: CashflowItem, { dispatch }) => {
        // dispatch paymentSubmitted() to periodsSlice
        // console.log("Received from dispatch:", { newPayment })
        dispatch(
          paymentSubmitted({
            periodId: newPayment.period_id,
            paymentAmount: newPayment.amount,
          }),
        )
        const receivedNewPayment = await uploadPayment(newPayment)
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

          // add new fixed payment to state
          state.cashflow.push(action.payload.newPayment)
        },
      },
    ),
  }),
  selectors: {
    selectCashflow: state => state.cashflow,
  },
})

export const { addedPayment } = cashflowSlice.actions
export const { selectCashflow } = cashflowSlice.selectors
export default cashflowSlice.reducer

const returnPeriodId = (
  state: RootState,
  periodId: FinancePeriod["id"],
): FinancePeriod["id"] => periodId

export const selectCashFlowById = createAppSelector(
  [selectCashflow, returnPeriodId],
  (cashflow, periodId: string) =>
    cashflow.filter(c => c.period_id === periodId),
)

export const selectEarningsByPeriodId = createAppSelector(
  [selectCashflow, returnPeriodId],
  (earnings, periodId) =>
    earnings.filter(e => e.type === "earning" && e.period_id === periodId),
)

export const selectFixedPaymentsByPeriodId = createAppSelector(
  [selectCashflow, returnPeriodId],
  (payments, periodId) =>
    payments.filter(
      p => p.type === "fixed-payment" && p.period_id === periodId,
    ),
)

export const selectVariablePaymentsByPeriodId = createAppSelector(
  [selectCashflow, returnPeriodId],
  (payments, periodId) =>
    payments.filter(
      p => p.type === "variable-payment" && p.period_id === periodId,
    ),
)
