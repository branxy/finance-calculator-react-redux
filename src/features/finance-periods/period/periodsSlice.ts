import { getDaysBetweenTwoDates, getTodayDate } from "../../../utils"
import type { Periods, FinancePeriod, CashflowItem, Cashflow } from "../types"
import { v4 as uuidv4 } from "uuid"
import { createAppSlice } from "../../../app/createAppSlice"
import { createEntityAdapter, type PayloadAction } from "@reduxjs/toolkit"
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

const periodsAdapter = createEntityAdapter<FinancePeriod>()

const initialState = periodsAdapter.getInitialState(
  {
    status: "idle",
    error: null,
  },
  [
    {
      id: "1",
      user_id: uuidv4(),
      start_date: getTodayDate(),
      start_balance: 0,
      end_balance: 0,
      stock: 6000,
      forward_payments: 12000,
    },
  ],
)

interface InitialState {
  periods: Periods
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

interface ChangeStartDate {
  periodId: FinancePeriod["id"]
  newStartBalance: FinancePeriod["start_balance"]
}

interface DeletePeriod {
  periodId: FinancePeriod["id"]
}

interface addPeriodProps {
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
  periodId: FinancePeriod["id"]
  periodIndex: number
  savingType: "income/stock" | "income/forward-payment"
  newStockStartAmount: CashflowItem["amount"]
  newFPStartAmount: CashflowItem["amount"]
}

export type CompensationsToUpdate = CompensationToUpdate[]

export interface CompensationAmount {
  stock: number
  fp: number
}

interface PaymentSubmittedSingle {
  periodId: FinancePeriod["id"]
  periodIndex: number
  newStartBalance: FinancePeriod["start_balance"]
  newEndBalance: FinancePeriod["end_balance"]
  newStockStart: FinancePeriod["stock"]
  newFPStart: FinancePeriod["forward_payments"]
}

export type PaymentSubmittedUpdates = PaymentSubmittedSingle[]

export interface DeletedTransactionUpdate {
  periodId: FinancePeriod["id"]
  periodIndex: number
  newStartBalance: FinancePeriod["start_balance"]
  newEndBalance: FinancePeriod["end_balance"]
  newStockStart: FinancePeriod["stock"]
  newFPStart: FinancePeriod["forward_payments"]
}

export type DeletedTransactionsUpdate = DeletedTransactionUpdate[]

export const periodsSlice = createAppSlice({
  name: "periods",
  initialState,
  reducers: create => ({
    periodAdded: create.asyncThunk(
      async ({ prevPeriodId, user_id }: addPeriodProps, { getState }) => {
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
          state.status = "succeeded"

          const { newPeriod } = action.payload
          periodsAdapter.addOne(state, newPeriod)
          // state.periods.push(action.payload.newPeriod)
        },
      },
    ),
    startDateChanged: create.asyncThunk(
      async (
        { periodId, newStartDate }: ChangeStartDateProps,
        { getState },
      ) => {
        // pass newStartDate prop to updateStartDate()

        // delete this state call when you connect db, because it will return the required object and pass to reducer
        const {
          periods: { entities },
        } = getState() as RootState
        const currentPeriod = entities[periodId]

        if (currentPeriod) {
          // periodId will be needed, when you use db
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
          state.status = "succeeded"

          // update current period start date
          const { periodId: id, newStartDate: start_date } =
            action.payload.valueToUpdate
          periodsAdapter.updateOne(state, { id, changes: { start_date } })
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

          // periodId will be needed, when you use db
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
          state.status = "succeeded"

          // for every period that needs updating, update it
          const { periodsToUpdate } = action.payload

          // const valuesToMapType: [string, ValueToUpdate][] =
          //   periodsToUpdate.map(p => [p.periodId, p])
          // const valuesMap = new Map(valuesToMapType)

          periodsAdapter.updateMany(state, periodsToUpdate)

          // for (const property in entities) {
          //   const p = entities[property]
          //   const newValue = valuesMap.get(p.id)

          //   if (newValue) {
          //     const { newStartBalance, newEndBalance } = newValue

          //     p.start_balance = newStartBalance
          //     p.end_balance = newEndBalance
          //   }
          // }
          // _______
          // const updatedPeriods = periods.map(p => {
          //   const newValue = valuesMap.get(p.id)

          //   if (newValue) {
          //     return {
          //       ...p,
          //       start_balance: newValue.newStartBalance,
          //       end_balance: newValue.newEndBalance,
          //     }
          //   } else return p
          // })

          // state.periods = updatedPeriods
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
        // just add the difference to current balance

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
              periodId: p.id,
              periodIndex: i,
              newStartBalance: newStartBalanceForPeriod,
              newEndBalance: newEndBalanceForPeriod,
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
          state.status = "succeeded"

          const { periods } = state
          const { newValues } = action.payload
          const currentPeriodIndex = newValues[0].periodIndex
          const map = new Map(newValues.map(p => [p.periodId, p]))

          for (let i = currentPeriodIndex; i < periods.length; i++) {
            const p = periods[i]
            const newValue = map.get(p.id)

            if (newValue) {
              p.start_balance = newValue.newStartBalance
              p.end_balance = newValue.newEndBalance
            }
          }
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
          periods: { periods },
        } = getState() as RootState
        const currentPeriodIndex = periods.findIndex(p => p.id === periodId)
        const currentPeriod = periods[currentPeriodIndex]

        if (currentPeriod) {
          const valuesToUpdate: ValuesToUpdate = []

          for (let i = currentPeriodIndex; i < periods.length; i++) {
            const p = periods[i]
            let newStartBalanceForPeriod
            let newEndBalanceForPeriod

            if (p.id === currentPeriod.id) {
              newStartBalanceForPeriod = p.start_balance
              newEndBalanceForPeriod = p.end_balance - paymentAmount
            } else {
              newStartBalanceForPeriod = p.start_balance - paymentAmount
              newEndBalanceForPeriod = p.end_balance - paymentAmount
            }

            valuesToUpdate.push({
              periodId: p.id,
              periodIndex: i,
              newStartBalance: newStartBalanceForPeriod,
              newEndBalance: newEndBalanceForPeriod,
            })
          }

          // periodId will be needed, when you use db
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
          state.status = "succeeded"

          const { periods } = state
          const { periodsToUpdate } = action.payload

          const valuesToMapType: [string, ValueToUpdate][] =
            periodsToUpdate.map(p => [p.periodId, p])
          const valuesMap = new Map(valuesToMapType)
          const updatedPeriods = periods.map(p => {
            const newValue = valuesMap.get(p.id)

            if (newValue) {
              return {
                ...p,
                start_balance: newValue.newStartBalance,
                end_balance: newValue.newEndBalance,
              }
            } else return p
          })

          state.periods = updatedPeriods
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
          periods: { periods },
        } = getState() as RootState
        const currentPeriodIndex = periods.findIndex(p => p.id === periodId)
        const currentPeriod = periods[currentPeriodIndex]

        if (currentPeriod) {
          const valuesToUpdate: ValuesToUpdate = []

          for (let i = currentPeriodIndex; i < periods.length; i++) {
            const p = periods[i]
            let newStartBalanceForPeriod
            let newEndBalanceForPeriod

            if (p.id === currentPeriod.id) {
              newStartBalanceForPeriod = p.start_balance
              newEndBalanceForPeriod = p.end_balance + incomeAmount
            } else {
              newStartBalanceForPeriod = p.start_balance + incomeAmount
              newEndBalanceForPeriod = p.end_balance + incomeAmount
            }

            valuesToUpdate.push({
              periodId: p.id,
              periodIndex: i,
              newStartBalance: newStartBalanceForPeriod,
              newEndBalance: newEndBalanceForPeriod,
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
          state.status = "succeeded"

          const { periods } = state
          const { newPeriods } = action.payload
          const currentIndex = periods.findIndex(
            p => p.id === newPeriods[0].periodId,
          )

          const newPeriodsMap = new Map(newPeriods.map(p => [p.periodId, p]))

          for (let i = currentIndex; i < periods.length; i++) {
            const p = periods[i]
            const newValue = newPeriodsMap.get(p.id)

            if (newValue) {
              const { newStartBalance, newEndBalance } = newValue

              p.start_balance = newStartBalance
              p.end_balance = newEndBalance
            }
          }
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
          periods: { periods },
        } = getState() as RootState

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
              periodId: p.id,
              periodIndex: i,
              savingType,
              newStockStartAmount,
              newFPStartAmount,
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
          state.status = "succeeded"

          const { periods } = state
          const { receivedValues } = action.payload
          const currentIndex = periods.findIndex(
            p => p.id === receivedValues[0].periodId,
          )

          const newValuesMap = new Map(receivedValues.map(p => [p.periodId, p]))

          for (let i = currentIndex; i < periods.length; i++) {
            const p = periods[i]
            const newValue = newValuesMap.get(p.id)

            if (newValue) {
              const { newStockStartAmount, newFPStartAmount } = newValue

              p.stock = newStockStartAmount
              p.forward_payments = newFPStartAmount
            }
          }
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
          periods: { periods },
        } = getState() as RootState
        const currentPeriodIndex = periods.findIndex(p => p.id === periodId)
        const currentPeriod = periods[currentPeriodIndex]
        const compensationSum = compensationAmount.stock + compensationAmount.fp

        if (currentPeriod) {
          const valuesToUpdate: PaymentSubmittedUpdates = []

          for (let i = currentPeriodIndex; i < periods.length; i++) {
            const p = periods[i]
            let newStartBalance, newEndBalance, newStockStart, newFPStart

            if (p.id === currentPeriod.id) {
              newStartBalance = p.start_balance
              newEndBalance = p.end_balance + compensationSum
              newStockStart = p.stock - compensationAmount.stock
              newFPStart = p.forward_payments - compensationAmount.fp
            } else {
              newStartBalance = p.start_balance + compensationSum
              newEndBalance = p.end_balance + compensationSum
              newStockStart = p.stock - compensationAmount.stock
              newFPStart = p.forward_payments - compensationAmount.fp
            }

            valuesToUpdate.push({
              periodId: p.id,
              periodIndex: i,
              newStartBalance,
              newEndBalance,
              newStockStart,
              newFPStart,
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
          state.status = "succeeded"

          const { periods } = state
          const { receivedValues } = action.payload
          const currentIndex = periods.findIndex(
            p => p.id === receivedValues[0].periodId,
          )

          const valuesToMap = new Map(
            receivedValues.map((obj: PaymentSubmittedSingle) => [
              obj.periodId,
              obj,
            ]),
          )

          for (let i = currentIndex; i < periods.length; i++) {
            const p = periods[i]
            const newValue = valuesToMap.get(p.id)

            if (newValue) {
              const {
                newStartBalance,
                newEndBalance,
                newStockStart,
                newFPStart,
              } = newValue as PaymentSubmittedSingle

              p.start_balance = newStartBalance
              p.end_balance = newEndBalance
              p.stock = newStockStart
              p.forward_payments = newFPStart
            }
          }
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
          periods: { periods },
          cashflow: { cashflow },
        } = getState() as RootState

        const deletedTransactions = cashflow.filter(c =>
          deletedTransactionsIds.includes(c.id),
        )
        // First, sum all transactions by type
        const sumOfTransactions = {
          income: 0,
          spend: 0,
          stock: 0,
          forwardPayments: 0,
        }

        for (let i = 0; i < deletedTransactions.length; i++) {
          const transaction = deletedTransactions[i]
          const { amount } = transaction

          switch (transaction.type) {
            case "income/profit":
              sumOfTransactions.income += amount
              break
            case "income/stock":
              sumOfTransactions.stock += amount
              break
            case "income/forward-payment":
              sumOfTransactions.forwardPayments += amount
              break
            case "payment/fixed":
            case "payment/variable":
              sumOfTransactions.spend += amount
              break
            case "compensation/stock":
              sumOfTransactions.stock -= amount
              break
            case "compensation/forward-payment":
              sumOfTransactions.forwardPayments -= amount
              break
            default:
              throw new Error(`Unknown transaction type: ${transaction.type}`)
          }
        }
        const currentPeriodIndex = periods.findIndex(p => p.id === periodId)
        const currentPeriod = periods[currentPeriodIndex]

        if (currentPeriod) {
          const valuesToUpdate: DeletedTransactionsUpdate = []

          for (let i = currentPeriodIndex; i < periods.length; i++) {
            const p = periods[i]
            const { income, spend, stock, forwardPayments } = sumOfTransactions
            const interimBalance = -income + spend
            let newStartBalanceForPeriod,
              newEndBalanceForPeriod = p.end_balance + interimBalance,
              newStock = p.stock + stock,
              newFP = p.forward_payments + forwardPayments

            if (p.id === currentPeriod.id) {
              newStartBalanceForPeriod = p.start_balance
            } else {
              newStartBalanceForPeriod = p.start_balance + interimBalance
            }

            valuesToUpdate.push({
              periodId: p.id,
              periodIndex: i,
              newStartBalance: newStartBalanceForPeriod,
              newEndBalance: newEndBalanceForPeriod,
              newStockStart: newStock,
              newFPStart: newFP,
            })
          }

          // periodId will be needed, when you use db
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
          state.status = "succeeded"

          const { periods } = state
          const { periodsToUpdate } = action.payload

          const currentIndex = periods.findIndex(
            p => p.id === periodsToUpdate[0].periodId,
          )

          const periodsToUpdateMap = new Map(
            periodsToUpdate.map(p => [p.periodId, p]),
          )

          for (let i = currentIndex; i < periods.length; i++) {
            const p = periods[i]
            const newValue = periodsToUpdateMap.get(p.id)

            if (newValue) {
              const {
                newStartBalance,
                newEndBalance,
                newStockStart,
                newFPStart,
              } = newValue

              p.start_balance = newStartBalance
              p.end_balance = newEndBalance
              p.stock = newStockStart
              p.forward_payments = newFPStart
            }
          }
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
  selectors: {
    selectPeriods: state => state.periods,
  },
})

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
export const { selectPeriods } = periodsSlice.selectors
export default periodsSlice.reducer

const getId = (
  state: RootState,
  id: FinancePeriod["id"],
): FinancePeriod["id"] => id
const getIndex = (state: RootState, index: number): number => index

export const selectPeriodByIndex = createAppSelector(
  [selectPeriods, getIndex],
  (state, index) => state[index],
)

export const selectPeriodStartDateByIndex = createAppSelector(
  [selectPeriods, getIndex],
  (state, index) => state[index]?.start_date,
)
