import { getDaysBetweenTwoDates, getTodayDate } from "../../utils"
import type { Periods, FinancePeriod, CashflowItem } from "./types"
import { v4 as uuidv4 } from "uuid"
import { createAppSlice } from "../../app/createAppSlice"
import { type PayloadAction } from "@reduxjs/toolkit"
import {
  uploadPeriod,
  updateStartDate,
  updatePeriodsBalance,
} from "./api/periodsApi"
import { type RootState } from "../../app/store"

const initialState: InitialState = {
  periods: [
    {
      id: "1",
      user_id: uuidv4(),
      start_date: getTodayDate(),
      start_balance: 0,
      end_balance: 0,
      stock_start_amount: 6000,
      stock_end_amount: 6000,
      forward_payments_start_amount: 12000,
      forward_payments_end_amount: 12000,
    },
  ],
  status: "idle",
  error: null,
}

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
  periodId: FinancePeriod["id"]
  periodIndex: number
  newStartBalance: FinancePeriod["start_balance"]
  newEndBalance: FinancePeriod["end_balance"]
}

export type ValuesToUpdate = ValueToUpdate[]

export const periodsSlice = createAppSlice({
  name: "periods",
  initialState,
  reducers: create => ({
    // done
    addedPeriod: create.asyncThunk(
      async ({ prevPeriodId, user_id }: addPeriodProps, { getState }) => {
        const state = getState() as RootState

        const prevPeriod = state.periods.periods.find(
          p => p.id === prevPeriodId,
        )

        if (prevPeriod) {
          const { end_balance, stock_end_amount, forward_payments_end_amount } =
            prevPeriod

          const newPeriod: Omit<FinancePeriod, "id"> = {
            user_id: user_id,
            start_date: prevPeriod.start_date,
            start_balance: end_balance,
            end_balance: end_balance,
            stock_start_amount: stock_end_amount,
            stock_end_amount: stock_end_amount,
            forward_payments_start_amount: forward_payments_end_amount,
            forward_payments_end_amount: forward_payments_end_amount,
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

          state.periods.push(action.payload.newPeriod)
        },
      },
    ),
    // done
    changedStartDate: create.asyncThunk(
      async (
        { periodId, newStartDate }: ChangeStartDateProps,
        { getState },
      ) => {
        // pass newStartDate prop to updateStartDate()

        // delete this state call when you connect db, because it will return the required object and pass to reducer
        const {
          periods: { periods },
        } = getState() as RootState
        const currentPeriod = periods.find(p => p.id === periodId)

        if (currentPeriod) {
          // periodId will be needed, when you use db
          const newPeriod: FinancePeriod = await updateStartDate(
            periodId,
            newStartDate,
            currentPeriod,
          )

          return { newPeriod }
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

          // update current period start date (by updating the whole period object)
          const { periods } = state
          const currentPeriodIndex = periods.findIndex(
            p => p.id === action.payload.newPeriod.id,
          )

          periods[currentPeriodIndex] = action.payload.newPeriod
        },
      },
    ),
    // rewriting to asyncThunk
    changedStartBalance: create.asyncThunk(
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
            let difference

            // here I need to establish the difference between a previous start_balance and newStartBalance
            // start_balance >=0
            // newStartBalance >=0
            //       1000                             600
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

          // for every period that needs updating, update it
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
    paymentSubmitted: create.asyncThunk(
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
    deletedPeriod: create.asyncThunk(
      (periodId: FinancePeriod["id"]) => {
        // await supabase request
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
          // fix to delete
          // state.periods.push(action.payload)
        },
      },
    ),
  }),
  extraReducers: builder => {},
  selectors: {
    selectPeriods: state => state.periods,
  },
})

export const {
  addedPeriod,
  changedStartDate,
  changedStartBalance,
  paymentSubmitted,
} = periodsSlice.actions
export const { selectPeriods } = periodsSlice.selectors
export default periodsSlice.reducer
