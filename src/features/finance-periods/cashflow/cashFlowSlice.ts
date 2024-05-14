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
import { type RootState } from "../../../app/store"
import { createAppSelector } from "../../../app/hooks"
import {
  deleteCashflowItems,
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
  cashflowDeletedFromCashflow,
} from "../period/periodsSlice"
import { createEntityAdapter } from "@reduxjs/toolkit"

const sampleCashflowItem: CashflowItem = {
  id: uuidv4(),
  period_id: "1",
  user_id: "1-user-id",
  type: "payment/fixed",
  title: "Аренда квартиры",
  amount: 20000,
  date: getTodayDate(),
}

const testCashflow = generateTestCashflow(
  5,
  ["exp1", "exp2", "exp3", "exp4", "exp5"],
  [10000, 4000, 6000, 5000, 5000],
)

const casfhlowAdapter = createEntityAdapter<CashflowItem>()
const initialState = casfhlowAdapter.getInitialState(
  {
    status: "idle",
    error: null,
  },
  testCashflow,
)

export const cashflowSlice = createAppSlice({
  name: "cashflow",
  initialState,
  reducers: create => ({
    paymentAdded: create.asyncThunk(
      async (newPayment: CashflowItem, { dispatch, getState }) => {
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
          const { newPayment } = action.payload

          casfhlowAdapter.addOne(state, newPayment)
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
          const { newIncome } = action.payload

          // add new income to state
          casfhlowAdapter.addOne(state, newIncome)
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
          cashflow: { entities },
        } = getState() as RootState

        if (whatChanged === "amount" && typeof newValue === "number") {
          const currentItem = entities[cashflowItemId]
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

          const { entities: cashflow } = state
          const { itemId, newValueType, newValue } = action.payload
          const itemToUpdate = cashflow[itemId]

          if (itemToUpdate) {
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
          } else throw new Error(`Item with id ${itemId} not found`)
        },
      },
    ),
    compensationSubmitted: create.asyncThunk(
      async (
        {
          periodId,
          userId,
          compensationAmount,
        }: {
          periodId: FinancePeriod["id"]
          userId: FinancePeriod["user_id"]
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
            user_id: userId,
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
            user_id: userId,
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
          const { receivedValues } = action.payload
          casfhlowAdapter.addMany(state, receivedValues)

          state.status = "succeeded"
        },
      },
    ),
    deletedCashflowItems: create.asyncThunk(
      async (
        {
          periodId,
          currentPeriodWasDeleted,
          selectedTransactions,
        }: {
          periodId: FinancePeriod["id"]
          currentPeriodWasDeleted: boolean
          selectedTransactions: CashflowItem["id"][]
        },
        { dispatch },
      ) => {
        dispatch(
          cashflowDeletedFromCashflow({
            periodId,
            currentPeriodWasDeleted,
            deletedTransactionsIds: selectedTransactions,
          }),
        )
        const itemsToDelete = await deleteCashflowItems(selectedTransactions)
        return itemsToDelete
      },
      {
        pending: state => {
          state.status = "loading"
        },
        rejected: (state, action) => {
          state.status = "failed"
        },
        fulfilled: (state, action) => {
          const itemsToDelete = action.payload
          casfhlowAdapter.removeMany(state, itemsToDelete)

          state.status = "succeeded"
        },
      },
    ),
    deletedPeriodCashflow: create.asyncThunk(
      async (periodId: CashflowItem["period_id"]) => {
        // delete all casfhlow items with provided periodId
      },
      {
        pending: state => {
          state.status = "loading"
        },
        rejected: (state, action) => {
          state.status = "failed"
        },
        fulfilled: (state, action) => {
          const itemsToDelete = action.payload
          // casfhlowAdapter.removeMany(state, itemsToDelete)

          state.status = "succeeded"
        },
      },
    ),
  }),
  selectors: {},
})

export const { selectAll: selectAllCashflow } = casfhlowAdapter.getSelectors(
  (state: RootState) => state.cashflow,
)

export const {
  paymentAdded,
  cashflowItemChanged,
  incomeAdded,
  compensationSubmitted,
  deletedCashflowItems,
  deletedPeriodCashflow,
} = cashflowSlice.actions
export default cashflowSlice.reducer

const returnPeriodId = (
  state: RootState,
  periodId: FinancePeriod["id"],
): FinancePeriod["id"] => periodId

export const selectAllCashflowByPeriodId = createAppSelector(
  [selectAllCashflow, returnPeriodId],
  (cashflow, periodId: string): Cashflow =>
    cashflow.filter(c => c.period_id === periodId),
)

export const selectEarningsByPeriodId = createAppSelector(
  [selectAllCashflow, returnPeriodId],
  (earnings, periodId) =>
    earnings.filter(
      e => e.type === "income/profit" && e.period_id === periodId,
    ),
)

export const selectAllPaymentsByPeriodId = createAppSelector(
  [selectAllCashflow, returnPeriodId],
  (payments, periodId) =>
    payments.filter(
      p =>
        (p.type === "payment/fixed" || p.type === "payment/variable") &&
        p.period_id === periodId,
    ),
)

export const selectFixedPaymentsByPeriodId = createAppSelector(
  [selectAllCashflow, returnPeriodId],
  (payments, periodId) =>
    payments.filter(
      p => p.type === "payment/fixed" && p.period_id === periodId,
    ),
)

export const selectVariablePaymentsByPeriodId = createAppSelector(
  [selectAllCashflow, returnPeriodId],
  (payments, periodId) =>
    payments.filter(
      p => p.type === "payment/variable" && p.period_id === periodId,
    ),
)

export const selectSumOfStockAndFPCompensationsByPeriodId = createAppSelector(
  [selectAllCashflow, returnPeriodId],
  (cashflow, periodId): [number, number] => {
    let sumofStockCompensations = 0,
      sumOfFPCompensations = 0

    for (const c of cashflow) {
      if (c.period_id === periodId) {
        if (c.type === "compensation/stock") {
          sumofStockCompensations += c.amount
        } else if (c.type === "compensation/forward-payment") {
          sumOfFPCompensations += c.amount
        }
      }
    }

    return [sumofStockCompensations, sumOfFPCompensations]
  },
)

export const selectAllFPCompensationsByPeriodId = createAppSelector(
  [selectAllCashflow, returnPeriodId],
  (cashflow, periodId) =>
    cashflow.filter(
      c => c.type === "income/forward-payment" && c.period_id === periodId,
    ) as FPCompensations,
)
