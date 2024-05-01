import { createAppSlice } from "../../../app/createAppSlice"
import type {
  Cashflow,
  CashflowItem,
  CashFlowTable,
  FinancePeriod,
  FPCompensations,
  StockCompensations,
} from "../types"
import { v4 as uuidv4 } from "uuid"
import { getTodayDate } from "../../../utils"
import { PayloadAction } from "@reduxjs/toolkit"
import { type RootState } from "../../../app/store"
import { createAppSelector } from "../../../app/hooks"
import {
  generateTestCashflow,
  updateTransaction,
  uploadCompensations,
  uploadTransaction,
} from "../api/cashflowApi"
import {
  type CompensationAmount,
  compensationSubmittedFromCashflow,
  endBalanceChanged,
  incomeAddedFromCashflow,
  paymentAddedFromCashflow,
  savingsAddedFromCashflow,
} from "../period/periodsSlice"
import {
  type EarningsT,
  type FixedPaymentsT,
  type VariablePaymentsT,
} from "./Forecast"

const sampleCashflowItem: CashflowItem = {
  id: uuidv4(),
  period_id: "1",
  type: "payment/fixed",
  title: "Аренда квартиры",
  amount: 20000,
  date: getTodayDate(),
}

const testCashflow = generateTestCashflow(
  undefined,
  ["Аренда", "Аренда", "Аренда"],
  [20000, 34000, 4000],
)

const initialState: CashFlowTable = {
  cashflow: testCashflow,
  status: "idle",
  error: null,
}

export const cashflowSlice = createAppSlice({
  name: "cashflow",
  initialState,
  reducers: create => ({
    paymentAdded: create.asyncThunk(
      async (newPayment: CashflowItem, { dispatch }) => {
        // dispatch paymentAddedFromCashflow() to periodsSlice
        // console.log("Received from dispatch:", { newPayment })
        dispatch(
          paymentAddedFromCashflow({
            periodId: newPayment.period_id,
            paymentAmount: newPayment.amount,
          }),
        )
        const receivedNewPayment = await uploadTransaction(newPayment)
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
    incomeAdded: create.asyncThunk(
      async (newIncome: CashflowItem, { dispatch }) => {
        // 1. Pass the income amount to periods reducer

        switch (newIncome.type) {
          case "income/profit":
            dispatch(
              incomeAddedFromCashflow({
                periodId: newIncome.period_id,
                incomeAmount: newIncome.amount,
              }),
            )
            break
          case "income/stock":
          case "income/forward-payment":
            dispatch(
              savingsAddedFromCashflow({
                periodId: newIncome.period_id,
                savingType: newIncome.type,
                savingAmount: newIncome.amount,
              }),
            )
            break
          default:
            break
        }

        const receivedObject = await uploadTransaction(newIncome)

        return { newIncome: receivedObject }
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

          // add new income to state
          state.cashflow.push(action.payload.newIncome)
        },
      },
    ),
    cashflowItemChanged: create.asyncThunk(
      async (
        {
          cashflowItemId,
          whatChanged,
          newValue,
        }: {
          cashflowItemId: CashflowItem["id"]
          whatChanged: "title" | "amount" | "date"
          newValue: string | number
        },
        { dispatch, getState },
      ) => {
        const {
          cashflow: { cashflow },
        } = getState() as RootState

        if (whatChanged === "amount" && typeof newValue === "number") {
          if (newValue >= 0 && newValue <= 100000000000) {
            const currentItem = cashflow.find(i => i.id === cashflowItemId)
            if (currentItem) {
              // dispatch balanceChanged() to periodsSlice
              const difference = newValue - currentItem.amount
              dispatch(
                endBalanceChanged({
                  periodId: currentItem.period_id,
                  whatChanged:
                    currentItem.type === "income/profit" ? "income" : "payment",
                  difference,
                }),
              )
            }
          } else
            throw new Error(
              `The value on new amount is outside accepted limits: ${newValue}`,
            )
        }

        const updatedValue = await updateTransaction({
          itemId: cashflowItemId,
          newValueType: whatChanged,
          newValue,
        })

        return updatedValue
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

          const { cashflow } = state
          const updatedValue = action.payload
          const itemToUpdate = cashflow.find(
            i => i.id === action.payload.itemId,
          )

          if (itemToUpdate) {
            const { newValue, newValueType } = updatedValue

            if (newValueType === "title" && typeof newValue === "string") {
              itemToUpdate.title = newValue
            } else if (
              newValueType === "amount" &&
              typeof newValue === "number"
            ) {
              itemToUpdate.amount = newValue
            } else if (
              newValueType === "date" &&
              typeof newValue === "string"
            ) {
              itemToUpdate.date = newValue
            } else
              throw new Error(
                `Unknown cashflow property: ${newValueType}, or data type of new value: ${typeof newValue} `,
              )
          } else
            throw new Error(`Item with id ${updatedValue.itemId} not found`)
        },
      },
    ),
    compensationSubmitted: create.asyncThunk(
      async (
        {
          periodId,
          compensationAmount,
        }: {
          periodId: FinancePeriod["id"]
          compensationAmount: CompensationAmount
        },
        { dispatch },
      ) => {
        // if both stock and fp were compensated, split them into separate cashflow objects
        dispatch(
          compensationSubmittedFromCashflow({ periodId, compensationAmount }),
        )

        const newCompensations: Cashflow = []

        if (compensationAmount.stock > 0) {
          newCompensations.push({
            id: uuidv4(),
            period_id: periodId,
            type: "compensation/stock",
            title: "compensation from stock",
            amount: compensationAmount.stock,
            date: getTodayDate(),
          })
        }

        if (compensationAmount.fp > 0) {
          newCompensations.push({
            id: uuidv4(),
            period_id: periodId,
            type: "compensation/forward-payment",
            title: "compensation from forward payment",
            amount: compensationAmount.fp,
            date: getTodayDate(),
          })
        }

        const receivedValues = await uploadCompensations(newCompensations)

        return { receivedValues }
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

          const { cashflow } = state
          action.payload.receivedValues.forEach(v => cashflow.push(v))
        },
      },
    ),
  }),
  selectors: {
    selectCashflow: state => state.cashflow,
  },
})

export const {
  paymentAdded,
  cashflowItemChanged,
  incomeAdded,
  compensationSubmitted,
} = cashflowSlice.actions
export const { selectCashflow } = cashflowSlice.selectors
export default cashflowSlice.reducer

const returnPeriodId = (
  state: RootState,
  periodId: FinancePeriod["id"],
): FinancePeriod["id"] => periodId

export const selectAllCashflowByPeriodId = createAppSelector(
  [selectCashflow, returnPeriodId],
  (cashflow, periodId: string): Cashflow =>
    cashflow.filter(c => c.period_id === periodId),
)

export const selectEarningsByPeriodId = createAppSelector(
  [selectCashflow, returnPeriodId],
  (earnings, periodId) =>
    earnings.filter(
      e => e.type === "income/profit" && e.period_id === periodId,
    ),
)

export const selectAllPaymentsByPeriodId = createAppSelector(
  [selectCashflow, returnPeriodId],
  (payments, periodId) =>
    payments.filter(
      p =>
        (p.type === "payment/fixed" || p.type === "payment/variable") &&
        p.period_id === periodId,
    ),
)

export const selectFixedPaymentsByPeriodId = createAppSelector(
  [selectCashflow, returnPeriodId],
  (payments, periodId) =>
    payments.filter(
      p => p.type === "payment/fixed" && p.period_id === periodId,
    ),
)

export const selectVariablePaymentsByPeriodId = createAppSelector(
  [selectCashflow, returnPeriodId],
  (payments, periodId) =>
    payments.filter(
      p => p.type === "payment/variable" && p.period_id === periodId,
    ),
)

export const selectAllStockCompensationsByPeriodId = createAppSelector(
  [selectCashflow, returnPeriodId],
  (cashflow, periodId) =>
    cashflow.filter(
      c => c.type === "income/stock" && c.period_id === periodId,
    ) as StockCompensations,
)

export const selectAllFPCompensationsByPeriodId = createAppSelector(
  [selectCashflow, returnPeriodId],
  (cashflow, periodId) =>
    cashflow.filter(
      c => c.type === "income/forward-payment" && c.period_id === periodId,
    ) as FPCompensations,
)
