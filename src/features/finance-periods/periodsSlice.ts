import { getDaysBetweenTwoDates, getTodayDate } from "../../utils"
import type { Periods, FinancePeriod } from "./types"
import { v4 as uuidv4 } from "uuid"
import { createAppSlice } from "../../app/createAppSlice"
import { type PayloadAction } from "@reduxjs/toolkit"
import { uploadPeriod, updateStartDate, updatePeriod } from "./api/periodsApi"
import { type RootState } from "../../app/store"

const initialState: InitialState = {
  periods: [
    {
      id: "1",
      user_id: uuidv4(),
      start_date: getTodayDate(),
      days_to_new_period: undefined,
      start_balance: 0,
      end_balance: 0,
      shortage: 0,
      stock_start_amount: 6000,
      stock_end_amount: 6000,
      forward_payments_start_amount: 12000,
      forward_payments_end_amount: 12000,
      stock_compensation: 0,
      forward_payments_compensation: 0,
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

export const periodsSlice = createAppSlice({
  name: "periods",
  initialState,
  reducers: create => ({
    addPeriod: create.asyncThunk(
      async ({ prevPeriodId, user_id }: addPeriodProps, { getState }) => {
        const state = getState() as RootState

        const prevPeriod = state.periods.periods.find(
          p => p.id === prevPeriodId,
        )

        if (prevPeriod) {
          const newDaysToNewPeriod = getDaysBetweenTwoDates(
            prevPeriod.start_date,
          )

          const {
            end_balance,
            shortage,
            stock_end_amount,
            forward_payments_end_amount,
          } = prevPeriod

          const newPeriod: Omit<FinancePeriod, "id"> = {
            user_id: user_id,
            start_date: prevPeriod.start_date,
            days_to_new_period: undefined,
            start_balance: end_balance,
            end_balance: end_balance,
            shortage: shortage,
            stock_start_amount: stock_end_amount,
            stock_end_amount: stock_end_amount,
            forward_payments_start_amount: forward_payments_end_amount,
            forward_payments_end_amount: forward_payments_end_amount,
            stock_compensation: 0,
            forward_payments_compensation: 0,
          }

          const receivedPeriod: FinancePeriod = await uploadPeriod(newPeriod)
          console.log({ receivedPeriod })
          return { newPeriod: receivedPeriod, prevPeriodId, newDaysToNewPeriod }
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

          const prevPeriod = state.periods.find(
            p => p.id === action.payload.prevPeriodId,
          )

          if (prevPeriod) {
            prevPeriod.days_to_new_period = action.payload.newDaysToNewPeriod
          }
          state.periods.push(action.payload.newPeriod)
        },
      },
    ),
    // rewrite to asyncThunk
    changeStartDate: create.asyncThunk(
      async (
        { periodId, newStartDate }: ChangeStartDateProps,
        { getState },
      ) => {
        // if next period exists, calculate the new value of days_to_next_period and pass it to updateStartDate()

        // delete this state call when you connect db, because it will return the required object and pass to reducer
        const {
          periods: { periods },
        } = getState() as RootState
        const [currentPeriod, nextPeriod] = periods.filter((p, i, arr) => {
          // this function finds the current period first, and then tries to find the next period by arr[i+1]
          if (p.id === periodId) {
            if (arr[i + 1]) {
              return [p, arr[i + 1]]
            } else return [p, undefined]
          } else return [undefined, undefined]
        })

        if (currentPeriod) {
          if (nextPeriod) {
            // update days_to_new_period
            const newDaysToNewPeriod = getDaysBetweenTwoDates(
              newStartDate,
              nextPeriod.start_date,
            )
            const newCurrentPeriod = await updatePeriod(
              currentPeriod,
              periodId,
              newStartDate,
              newDaysToNewPeriod,
            )

            return { newCurrentPeriod }
          }
          const newCurrentPeriod: FinancePeriod = await updateStartDate(
            currentPeriod,
            periodId,
            newStartDate,
          )

          return { newCurrentPeriod }
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

          // update current period start date, days_to_new_period (if has nextPeriod)
          const { periods } = state
          const currentPeriod = periods.find(p => p.id === action.payload)
          // update prevPeriod days_to_new_period
        },
      },
    ),
    changeStartDateOld: create.reducer(
      (
        state,
        action: PayloadAction<{
          periodId: FinancePeriod["id"]
          newStartDate: FinancePeriod["start_date"]
        }>,
      ) => {
        // update start date, days_to_new_period
        const indexOfPeriodToUpdate = state.periods.findIndex(
          p => p.id === action.payload.periodId,
        )
        const currentPeriod = state.periods[indexOfPeriodToUpdate]
        const nextPeriodStartDate =
          state.periods[indexOfPeriodToUpdate + 1]?.start_date
        currentPeriod.start_date = action.payload.newStartDate

        if (nextPeriodStartDate) {
          // update days_to_new_period
          currentPeriod.days_to_new_period = getDaysBetweenTwoDates(
            currentPeriod.start_date,
            nextPeriodStartDate,
          )
        }
      },
    ),
    // rewrite to asyncThunk
    changeStartBalance: create.reducer(
      (state, action: PayloadAction<ChangeStartDate>) => {
        const currentPeriod = state.periods.find(
          p => p.id === action.payload.periodId,
        )
        const { newStartBalance } = action.payload
        if (currentPeriod) {
          if (newStartBalance >= currentPeriod.start_balance) {
            // if new balance is greater than previous, add difference
            const difference = newStartBalance - currentPeriod.start_balance

            currentPeriod.start_balance = newStartBalance
            currentPeriod.end_balance += difference
            currentPeriod.shortage = currentPeriod.end_balance
          } else if (newStartBalance < currentPeriod.start_balance) {
            // if new balance is lesser than previous, substract difference

            const difference = currentPeriod.start_balance - newStartBalance
            currentPeriod.start_balance = newStartBalance
            currentPeriod.end_balance -= difference
            currentPeriod.shortage = currentPeriod.end_balance
          }
        }
      },
    ),
    deletePeriodAsync: create.asyncThunk(
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
    deletePeriod: create.reducer(
      (state, action: PayloadAction<DeletePeriod>) => {
        // 1. recalculate future periods' values based on the end values of prev period
        // 2. remove current period
        const { periodId } = action.payload
        const currentPeriodIndex = state.periods.findIndex(
          p => p.id === periodId,
        )

        if (state.periods[currentPeriodIndex + 1]) {
          //recalculate each future period values based on its predecessor
          for (let i = currentPeriodIndex - 1; i < state.periods.length; i++) {
            const period = state.periods[i]
            const prevPeriod = state.periods[i - 1]
            period.start_balance = prevPeriod.end_balance
            // period.end_balance ?? need info on cashflow within this period
          }
        }
      },
    ),
  }),
  selectors: {
    selectPeriods: state => state.periods,
  },
})

export const { addPeriod, changeStartDate, changeStartBalance } =
  periodsSlice.actions
export const { selectPeriods } = periodsSlice.selectors
export default periodsSlice.reducer
