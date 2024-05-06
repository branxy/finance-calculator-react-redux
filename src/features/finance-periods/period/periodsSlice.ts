import { getTodayDate } from "../../../utils"
import type { Periods, FinancePeriod, CashflowItem } from "../types"
import { v4 as uuidv4 } from "uuid"
import { createAppSlice } from "../../../app/createAppSlice"
import { createEntityAdapter } from "@reduxjs/toolkit"
import {
  uploadPeriod,
  updateStartDate,
  updatePeriodsBalance,
  updateCompensation,
  uploadNewSavings,
  updateDeletedCashflow,
} from "../api/periodsApi"
import { type RootState } from "../../../app/store"
import { createAppSelector } from "../../../app/hooks"

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

interface ValueToUpdate {
  id: FinancePeriod["id"]
  changes: {
    start_balance: FinancePeriod["start_balance"]
    end_balance: FinancePeriod["end_balance"]
  }
}

export type ValuesToUpdate = ValueToUpdate[]

interface CompensationToUpdate {
  id: FinancePeriod["id"]
  changes: {
    stock: CashflowItem["amount"]
    forward_payments: CashflowItem["amount"]
  }
  // savingType: "income/stock" | "income/forward-payment"
}

export type CompensationsToUpdate = CompensationToUpdate[]

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

const samplePeriod = {
  id: "1",
  user_id: uuidv4(),
  start_date: getTodayDate(),
  start_balance: 0,
  end_balance: 0,
  stock: 6000,
  forward_payments: 12000,
}

const initialState = periodsAdapter.getInitialState(
  {
    status: "idle",
    error: null,
  },
  [samplePeriod],
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
        // assemble a record of all periods' balances that need to be updated and pass to updatePeriodsBalance()

        const {
          periods: { entities },
        } = getState() as RootState

        const periods = Object.values(entities)
        const currentPeriodIndex = periods.findIndex(p => p.id === periodId)
        const currentPeriod = periods[currentPeriodIndex]

        if (currentPeriod) {
          const valuesToUpdate: ValuesToUpdate = []

          for (let i = currentPeriodIndex; i < periods.length; i++) {
            const p = periods[i]
            let newStartBalanceForPeriod
            let newEndBalanceForPeriod
            let difference

            if (newStartBalance >= currentPeriod.start_balance) {
              // if the new start balance is greater or equal than current, just add the difference to every period
              difference = newStartBalance - currentPeriod.start_balance
              newStartBalanceForPeriod = p.start_balance + difference
              newEndBalanceForPeriod = p.end_balance + difference
            } else {
              // if the new start balance is lesser than current, substract the difference from every period

              difference = currentPeriod.start_balance - newStartBalance
              newStartBalanceForPeriod = p.start_balance - difference
              newEndBalanceForPeriod = p.end_balance - difference
            }

            valuesToUpdate.push({
              id: p.id,
              changes: {
                start_balance: newStartBalanceForPeriod,
                end_balance: newEndBalanceForPeriod,
              },
            })
          }

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
          const valuesToUpdate: ValuesToUpdate = []

          for (let i = currentPeriodIndex; i < periods.length; i++) {
            const p = periods[i]
            const isPayment = whatChanged === "payment"
            let newStartBalanceForPeriod, newEndBalanceForPeriod

            // if difference < 0, it means that newValue is lesser than current and you need to add the negative difference
            // if difference > 0, it means that newValue is greater than current and you need to substract the negative difference
            if (p.id === periodId) {
              newStartBalanceForPeriod = p.start_balance
              newEndBalanceForPeriod = isPayment
                ? p.end_balance - difference
                : p.end_balance + difference
            } else {
              newStartBalanceForPeriod = isPayment
                ? p.start_balance - difference
                : p.start_balance + difference
              newEndBalanceForPeriod = isPayment
                ? p.end_balance - difference
                : p.end_balance + difference
            }

            valuesToUpdate.push({
              id: p.id,
              changes: {
                start_balance: newStartBalanceForPeriod,
                end_balance: newEndBalanceForPeriod,
              },
            })
          }

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
        // assemble a record of all periods' balances that need to be updated and pass to updatePeriodsBalance()

        const {
          periods: { entities },
        } = getState() as RootState

        const periods = Object.values(entities)
        const currentPeriodIndex = periods.findIndex(p => p.id === periodId)
        const currentPeriod = periods[currentPeriodIndex]

        if (currentPeriod) {
          const valuesToUpdate: ValuesToUpdate = []

          for (let i = currentPeriodIndex; i < periods.length; i++) {
            const p = periods[i]
            let newStartBalanceForPeriod = p.start_balance
            let newEndBalanceForPeriod

            if (p.id === currentPeriod.id) {
              newEndBalanceForPeriod = p.end_balance - paymentAmount
            } else {
              newStartBalanceForPeriod = p.start_balance - paymentAmount
              newEndBalanceForPeriod = p.end_balance - paymentAmount
            }

            valuesToUpdate.push({
              id: p.id,
              changes: {
                start_balance: newStartBalanceForPeriod,
                end_balance: newEndBalanceForPeriod,
              },
            })
          }

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
          const valuesToUpdate: ValuesToUpdate = []

          for (let i = currentPeriodIndex; i < periods.length; i++) {
            const p = periods[i]
            let newStartBalanceForPeriod
            let newEndBalanceForPeriod = p.end_balance + incomeAmount

            if (p.id === currentPeriod.id) {
              newStartBalanceForPeriod = p.start_balance
            } else {
              newStartBalanceForPeriod = p.start_balance + incomeAmount
            }

            valuesToUpdate.push({
              id: p.id,
              changes: {
                start_balance: newStartBalanceForPeriod,
                end_balance: newEndBalanceForPeriod,
              },
            })
          }

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
          const valuesToUpdate: CompensationsToUpdate = []

          for (let i = currentPeriodIndex; i < periods.length; i++) {
            const p = periods[i]
            let newStockStartAmount = p.stock
            let newFPStartAmount = p.forward_payments

            if (savingType === "income/stock") {
              newStockStartAmount = p.stock + savingAmount
            } else if (savingType === "income/forward-payment") {
              newFPStartAmount = p.forward_payments + savingAmount
            }

            valuesToUpdate.push({
              id: p.id,
              changes: {
                stock: newStockStartAmount,
                forward_payments: newFPStartAmount,
              },
            })
          }

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
          const valuesToUpdate: PaymentSubmittedUpdates = []

          for (let i = currentPeriodIndex; i < periods.length; i++) {
            const p = periods[i]
            let newStartBalance = p.start_balance + compensationSum,
              newEndBalance = p.end_balance + compensationSum,
              newStockStart = p.stock - compensationAmount.stock,
              newFPStart = p.forward_payments - compensationAmount.fp

            if (i === currentPeriodIndex) {
              newStartBalance = p.start_balance
            }

            valuesToUpdate.push({
              id: p.id,
              changes: {
                start_balance: newStartBalance,
                end_balance: newEndBalance,
                stock: newStockStart,
                forward_payments: newFPStart,
              },
            })
          }

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
          deletedTransactionsIds,
        }: {
          periodId: FinancePeriod["id"]
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
        // First, sum all transactions by type
        const sumOfTransactions = {
          income: 0,
          spend: 0,
          stockIncome: 0,
          stockSpent: 0,
          forwardPaymentsIncome: 0,
          forwardPaymentsSpent: 0,
        }

        for (let i = 0; i < deletedTransactions.length; i++) {
          const transaction = deletedTransactions[i]
          const { amount } = transaction

          switch (transaction.type) {
            case "income/profit":
              sumOfTransactions.income -= amount
              break
            case "income/stock":
              sumOfTransactions.stockIncome += amount
              break
            case "income/forward-payment":
              sumOfTransactions.forwardPaymentsIncome += amount
              break
            case "payment/fixed":
            case "payment/variable":
              sumOfTransactions.spend += amount
              break
            case "compensation/stock":
              sumOfTransactions.stockSpent += amount
              break
            case "compensation/forward-payment":
              sumOfTransactions.forwardPaymentsSpent += amount
              break
            default:
              throw new Error(`Unknown transaction type: ${transaction.type}`)
          }
        }

        const periods = Object.values(entities)
        const currentPeriodIndex = periods.findIndex(p => p.id === periodId)
        const currentPeriod = periods[currentPeriodIndex]

        if (currentPeriod) {
          const valuesToUpdate: DeletedTransactionsUpdate = []

          for (let i = currentPeriodIndex; i < periods.length; i++) {
            const p = periods[i]
            const {
              income,
              spend,
              stockIncome,
              stockSpent,
              forwardPaymentsIncome,
              forwardPaymentsSpent,
            } = sumOfTransactions
            const interimBalance = -income + spend
            const submittedSavings = stockSpent + forwardPaymentsSpent
            let newStartBalanceForPeriod = p.start_balance + interimBalance,
              newEndBalanceForPeriod =
                p.end_balance + interimBalance - submittedSavings,
              newStock = p.stock - stockIncome + stockSpent,
              newFP =
                p.forward_payments -
                forwardPaymentsIncome +
                forwardPaymentsSpent

            if (i === currentPeriodIndex) {
              newStartBalanceForPeriod = p.start_balance
            }

            valuesToUpdate.push({
              id: p.id,
              changes: {
                start_balance: newStartBalanceForPeriod,
                end_balance: newEndBalanceForPeriod,
                stock: newStock,
                forward_payments: newFP,
              },
            })
          }

          const periodsToUpdate = await updateDeletedCashflow(valuesToUpdate)

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
    deletedPeriod: create.asyncThunk((periodId: FinancePeriod["id"]) => {}, {
      pending: state => {
        state.status = "loading"
      },
      rejected: (state, action) => {
        state.status = "failed"
      },
      fulfilled: (state, action) => {
        state.status = "succeeded"
      },
    }),
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
} = periodsSlice.actions

export default periodsSlice.reducer

const getId = (
  state: RootState,
  id: FinancePeriod["id"],
): FinancePeriod["id"] => id

const getIndex = (state: RootState, index: number): number => index

// export const selectPeriodById = createAppSelector(
//   [selectAllPeriods, getId],
//   (state, id) => state.find(p => p.id === id),
// )

export const selectPeriodStartDateByIndex = createAppSelector(
  [selectAllPeriods, getIndex],
  (state, index) => state[index]?.start_date,
)
