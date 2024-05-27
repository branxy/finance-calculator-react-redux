import { getTodayDate } from "../../../utils"
import type { Periods, FinancePeriod, CashflowItem } from "../types"
import { createAppSlice } from "../../../app/createAppSlice"
import { createEntityAdapter } from "@reduxjs/toolkit"
import {
  uploadPeriod,
  updateStartDate,
  updatePeriodsBalance,
  updateCompensation,
  uploadNewSavings,
  updateDeletedCashflow,
  deletePeriodFromDB,
} from "../api/periodsApi"
import { type RootState } from "../../../app/store"
import { createAppSelector } from "../../../app/hooks"
import { deletedCashflowItems } from "../cashflow/cashflowSlice"
import {
  type ValuesToUpdate,
  getPeriodsChangesOnTransactionsDelete,
  getSumOfTransactionsByType,
  getPeriodsOnStartBalanceChange,
  getPeriodsOnEndBalanceChange,
  getPeriodsOnPaymentAddedFromCashflow,
  getPeriodsOnIncomeAddedFromCashflow,
  getPeriodsOnSavingsAddedFromCashflow,
  getPeriodsOnCompensationSubmittedFromCashflow,
} from "./periodsCalculator"

interface InitialState {
  periods: Periods
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

interface AddPeriodProps {
  prevPeriodId: FinancePeriod["id"]
  user_id: FinancePeriod["user_id"]
}

interface ChangeStartDateProps {
  periodId: FinancePeriod["id"]
  newStartDate: FinancePeriod["start_date"]
}

export interface CompensationAmount {
  stock: number
  fp: number
}

interface PaymentSubmittedSingle {
  id: FinancePeriod["id"]
  changes: {
    start_balance: FinancePeriod["start_balance"]
    end_balance: FinancePeriod["end_balance"]
    stock: FinancePeriod["stock"]
    forward_payments: FinancePeriod["forward_payments"]
  }
}

export type PaymentSubmittedUpdates = PaymentSubmittedSingle[]

export type DeletedTransactionUpdate = PaymentSubmittedSingle

export type DeletedTransactionsUpdate = DeletedTransactionUpdate[]

const periodsAdapter = createEntityAdapter<FinancePeriod>()

const samplePeriods = [
  {
    id: "1",
    user_id: "1-user-id",
    start_date: getTodayDate(),
    start_balance: 10000,
    end_balance: 10000,
    stock: 15000,
    forward_payments: 23000,
  },
  // {
  //   id: "2",
  //   user_id: "2-user-id",
  //   start_date: getTodayDate(),
  //   start_balance: 10000,
  //   end_balance: -20000,
  //   stock: 45000,
  //   forward_payments: 23000,
  // },
]

const initialState = periodsAdapter.getInitialState(
  {
    status: "idle",
    error: null,
  },
  samplePeriods,
)

export const periodsSlice = createAppSlice({
  name: "periods",
  initialState,
  reducers: create => ({
    periodAdded: create.asyncThunk(
      async ({ prevPeriodId, user_id }: AddPeriodProps, { getState }) => {
        const state = getState() as RootState

        const prevPeriod = state.periods.entities[prevPeriodId]

        if (prevPeriod) {
          const { end_balance, stock, forward_payments } = prevPeriod

          const newPeriod: Omit<FinancePeriod, "id"> = {
            user_id: user_id,
            start_date: prevPeriod.start_date,
            start_balance: end_balance,
            end_balance: end_balance,
            stock: stock,
            forward_payments: forward_payments,
          }

          const receivedPeriod: FinancePeriod = await uploadPeriod(newPeriod)
          return { newPeriod: receivedPeriod }
        } else {
          throw new Error(`No previous period found: ${prevPeriod}`)
        }
      },
      {
        pending: state => {
          state.status = "loading"
        },
        rejected: (state, action) => {
          state.status = "failed"
        },
        fulfilled: (state, action) => {
          const { newPeriod } = action.payload
          periodsAdapter.addOne(state, newPeriod)

          state.status = "succeeded"
        },
      },
    ),
    startDateChanged: create.asyncThunk(
      async (
        { periodId, newStartDate }: ChangeStartDateProps,
        { getState },
      ) => {
        const {
          periods: { entities },
        } = getState() as RootState
        const currentPeriod = entities[periodId]

        if (currentPeriod) {
          const valueToUpdate = await updateStartDate({
            periodId,
            newStartDate,
          })

          return { valueToUpdate }
        } else {
          throw new Error(`Period with id ${periodId} not found`)
        }
      },
      {
        pending: state => {
          state.status = "loading"
        },
        rejected: (state, action) => {
          state.status = "failed"
        },
        fulfilled: (state, action) => {
          const { periodId: id, newStartDate: start_date } =
            action.payload.valueToUpdate

          periodsAdapter.updateOne(state, { id, changes: { start_date } })

          state.status = "succeeded"
        },
      },
    ),
    startBalanceChanged: create.asyncThunk(
      async (
        {
          periodId,
          newStartBalance,
        }: {
          periodId: FinancePeriod["id"]
          newStartBalance: FinancePeriod["start_balance"]
        },
        { getState },
      ) => {
        const {
          periods: { entities },
        } = getState() as RootState

        const periods = Object.values(entities)
        const currentPeriodIndex = periods.findIndex(p => p.id === periodId)
        const currentPeriod = periods[currentPeriodIndex]

        if (currentPeriod) {
          const balanceDifference =
            currentPeriod.start_balance - newStartBalance

          // assemble a record of all periods' balances that need to be updated and pass to updatePeriodsBalance()
          const valuesToUpdate = getPeriodsOnStartBalanceChange(
            periods,
            currentPeriodIndex,
            balanceDifference,
          )

          const periodsToUpdate = await updatePeriodsBalance(valuesToUpdate)

          return { periodsToUpdate }
        } else {
          throw new Error(`Period with id ${periodId} not found`)
        }
      },
      {
        pending: state => {
          state.status = "loading"
        },
        rejected: (state, action) => {
          state.status = "failed"
        },
        fulfilled: (state, action) => {
          const { periodsToUpdate } = action.payload
          periodsAdapter.updateMany(state, periodsToUpdate)

          state.status = "succeeded"
        },
      },
    ),
    endBalanceChanged: create.asyncThunk(
      async (
        {
          periodId,
          whatChanged,
          difference,
        }: {
          periodId: CashflowItem["period_id"]
          whatChanged: "income" | "payment"
          difference: number
        },
        { getState },
      ) => {
        const {
          periods: { entities },
        } = getState() as RootState

        const periods = Object.values(entities)
        const currentPeriodIndex = periods.findIndex(p => p.id === periodId)
        const currentPeriod = periods[currentPeriodIndex]

        if (currentPeriod) {
          const valuesToUpdate = getPeriodsOnEndBalanceChange(
            periods,
            currentPeriodIndex,
            periodId,
            whatChanged,
            difference,
          )

          const newValues = await updatePeriodsBalance(valuesToUpdate)

          return { newValues }
        } else {
          throw new Error(`Period with id ${periodId} not found`)
        }
      },
      {
        pending: state => {
          state.status = "loading"
        },
        rejected: (state, action) => {
          state.status = "failed"
        },
        fulfilled: (state, action) => {
          const { newValues } = action.payload
          periodsAdapter.updateMany(state, newValues)

          state.status = "succeeded"
        },
      },
    ),
    paymentAddedFromCashflow: create.asyncThunk(
      async (
        {
          periodId,
          paymentAmount,
        }: {
          periodId: FinancePeriod["id"]
          paymentAmount: CashflowItem["amount"]
        },
        { getState },
      ) => {
        const {
          periods: { entities },
        } = getState() as RootState

        const periods = Object.values(entities)
        const currentPeriodIndex = periods.findIndex(p => p.id === periodId)
        const currentPeriod = periods[currentPeriodIndex]

        if (currentPeriod) {
          // assemble a record of all periods' balances that need to be updated and pass to updatePeriodsBalance()
          const valuesToUpdate = getPeriodsOnPaymentAddedFromCashflow(
            periods,
            currentPeriodIndex,
            currentPeriod.id,
            paymentAmount,
          )

          const periodsToUpdate: ValuesToUpdate =
            await updatePeriodsBalance(valuesToUpdate)

          return { periodsToUpdate }
        } else {
          throw new Error(`Period with id ${periodId} not found`)
        }
      },
      {
        pending: state => {
          state.status = "loading"
        },
        rejected: (state, action) => {
          state.status = "failed"
        },
        fulfilled: (state, action) => {
          const { periodsToUpdate } = action.payload
          periodsAdapter.updateMany(state, periodsToUpdate)

          state.status = "succeeded"
        },
      },
    ),
    incomeAddedFromCashflow: create.asyncThunk(
      async (
        {
          periodId,
          incomeAmount,
        }: {
          periodId: FinancePeriod["id"]
          incomeAmount: CashflowItem["amount"]
        },
        { getState },
      ) => {
        // this reducer is called inside the cashflowSlice's addIncome() reducer, when income is added
        const {
          periods: { entities },
        } = getState() as RootState

        const periods = Object.values(entities)
        const currentPeriodIndex = periods.findIndex(p => p.id === periodId)
        const currentPeriod = periods[currentPeriodIndex]

        if (currentPeriod) {
          const valuesToUpdate = getPeriodsOnIncomeAddedFromCashflow(
            periods,
            currentPeriodIndex,
            currentPeriod.id,
            incomeAmount,
          )

          const periodsToUpdate: ValuesToUpdate =
            await updatePeriodsBalance(valuesToUpdate)

          return { newPeriods: periodsToUpdate }
        } else {
          throw new Error(`Period with id ${periodId} not found`)
        }
      },
      {
        pending: state => {
          state.status = "loading"
        },
        rejected: (state, action) => {
          state.status = "failed"
        },
        fulfilled: (state, action) => {
          const { newPeriods } = action.payload
          periodsAdapter.updateMany(state, newPeriods)

          state.status = "succeeded"
        },
      },
    ),
    savingsAddedFromCashflow: create.asyncThunk(
      async (
        {
          periodId,
          savingType,
          savingAmount,
        }: {
          periodId: FinancePeriod["id"]
          savingType: "income/stock" | "income/forward-payment"
          savingAmount: CashflowItem["amount"]
        },
        { getState },
      ) => {
        const {
          periods: { entities },
        } = getState() as RootState

        const periods = Object.values(entities)
        const currentPeriodIndex = periods.findIndex(p => p.id === periodId)
        const currentPeriod = periods[currentPeriodIndex]

        if (currentPeriod) {
          const valuesToUpdate = getPeriodsOnSavingsAddedFromCashflow(
            periods,
            currentPeriodIndex,
            savingType,
            savingAmount,
          )

          const receivedValues = await uploadNewSavings(valuesToUpdate)

          return { receivedValues }
        } else {
          throw new Error(`Period with id ${periodId} not found`)
        }
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
          periodsAdapter.updateMany(state, receivedValues)

          state.status = "succeeded"
        },
      },
    ),
    compensationSubmittedFromCashflow: create.asyncThunk(
      async (
        {
          periodId,
          compensationAmount,
        }: {
          periodId: FinancePeriod["id"]
          compensationAmount: CompensationAmount
        },
        { getState },
      ) => {
        const {
          periods: { entities },
        } = getState() as RootState

        const periods = Object.values(entities)
        const currentPeriodIndex = periods.findIndex(p => p.id === periodId)
        const currentPeriod = periods[currentPeriodIndex]
        const compensationSum = compensationAmount.stock + compensationAmount.fp

        if (currentPeriod) {
          const valuesToUpdate = getPeriodsOnCompensationSubmittedFromCashflow(
            periods,
            currentPeriodIndex,
            compensationSum,
            compensationAmount,
          )

          const receivedValues = await updateCompensation(valuesToUpdate)

          return { receivedValues }
        } else {
          throw new Error(`Period with id ${periodId} not found`)
        }
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
          periodsAdapter.updateMany(state, receivedValues)

          state.status = "succeeded"
        },
      },
    ),
    cashflowDeletedFromCashflow: create.asyncThunk(
      async (
        {
          periodId,
          currentPeriodWasDeleted,
          deletedTransactionsIds,
        }: {
          periodId: FinancePeriod["id"]
          currentPeriodWasDeleted: boolean
          deletedTransactionsIds: CashflowItem["id"][]
        },
        { getState },
      ) => {
        const {
          periods: { entities },
          cashflow: { entities: casfhlowEntities },
        } = getState() as RootState

        const cashflow = Object.values(casfhlowEntities)
        const deletedTransactions = cashflow.filter(c =>
          deletedTransactionsIds.includes(c.id),
        )
        //1. Sum all transactions by type
        const sumOfTransactions =
          getSumOfTransactionsByType(deletedTransactions)

        const periods = Object.values(entities)
        const currentPeriodIndex = periods.findIndex(p => p.id === periodId)
        const currentPeriod = periods[currentPeriodIndex]
        const indexToStartFrom = currentPeriodWasDeleted
          ? currentPeriodIndex + 1
          : currentPeriodIndex

        if (currentPeriod) {
          // 2. Calculate balance changes for each period
          const valuesToUpdate = getPeriodsChangesOnTransactionsDelete(
            periods,
            indexToStartFrom,
            sumOfTransactions,
            currentPeriodWasDeleted,
          )

          // 3. Upload changes to DB
          const periodsToUpdate = await updateDeletedCashflow(valuesToUpdate)

          // 4. Pass changes to reducer
          return { periodsToUpdate }
        } else {
          throw new Error(`Period with id ${periodId} not found`)
        }
      },
      {
        pending: state => {
          state.status = "loading"
        },
        rejected: (state, action) => {
          state.status = "failed"
        },
        fulfilled: (state, action) => {
          const { periodsToUpdate } = action.payload
          periodsAdapter.updateMany(state, periodsToUpdate)

          state.status = "succeeded"
        },
      },
    ),
    deletedPeriod: create.asyncThunk(
      async (periodId: FinancePeriod["id"], { getState, dispatch }) => {
        // A period was deleted. Dispatch an action to cashflowSlice delete all period cashflow.
        // Recalculate next periods' balance

        const {
          periods: { entities: periodEntities },
          cashflow: { entities: casfhlowEntities },
        } = getState() as RootState

        const cashflow = Object.values(casfhlowEntities)
        const cashflowToDelete = cashflow.reduce((table, c) => {
          if (c.period_id === periodId) {
            table.push(c.id)
          }

          return table
        }, [] as string[])

        dispatch(
          deletedCashflowItems({
            periodId,
            currentPeriodWasDeleted: true,
            selectedTransactions: cashflowToDelete,
          }),
        )

        const deletedPeriodId = await deletePeriodFromDB(periodId)
        return deletedPeriodId
      },
      {
        pending: state => {
          state.status = "loading"
        },
        rejected: (state, action) => {
          state.status = "failed"
        },
        fulfilled: (state, action) => {
          periodsAdapter.removeOne(state, action.payload)
          state.status = "succeeded"
        },
      },
    ),
  }),
  extraReducers: builder => {},
  selectors: {},
})

export const { selectAll: selectAllPeriods, selectById: selectPeriodById } =
  periodsAdapter.getSelectors((state: RootState) => state.periods)

export const {
  periodAdded,
  startDateChanged,
  startBalanceChanged,
  endBalanceChanged,
  paymentAddedFromCashflow,
  incomeAddedFromCashflow,
  savingsAddedFromCashflow,
  compensationSubmittedFromCashflow,
  cashflowDeletedFromCashflow,
  deletedPeriod,
} = periodsSlice.actions

export default periodsSlice.reducer

const getId = (
  state: RootState,
  id: FinancePeriod["id"],
): FinancePeriod["id"] => id

const getIndex = (state: RootState, index: number): number => index

export const selectPeriodStartDateByIndex = createAppSelector(
  [selectAllPeriods, getIndex],
  (state, index) => state[index]?.start_date,
)
