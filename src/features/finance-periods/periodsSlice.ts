import { getDaysBetweenTwoDates, getTodayDate } from "../../utils"
import type { Periods, FinancePeriod } from "./types"
import { v4 as uuidv4 } from "uuid"
import { createAppSlice } from "../../app/createAppSlice"
import { type PayloadAction } from "@reduxjs/toolkit"

const initialState: Periods = [
  {
    id: "1",
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
]

export const periodsSlice = createAppSlice({
  name: "periods",
  initialState,
  reducers: create => ({
    addPeriod: create.reducer(
      (periods, action: PayloadAction<FinancePeriod["id"]>) => {
        // updates previous periods' days_to_new_period
        if (typeof action.payload === "string") {
          const prevPeriod = periods.find(p => p.id === action.payload)
          if (prevPeriod) {
            // const currentPeriodTimestamp = new Date(getTodayDate()).getTime()
            // const prevPeriodTimestamp = new Date(prevPeriod.start_date).getTime()
            const newDaysToNewPeriod = getDaysBetweenTwoDates(
              prevPeriod.start_date,
            )
            console.log({ newDaysToNewPeriod })
            prevPeriod.days_to_new_period = newDaysToNewPeriod

            // adds new period to state
            const {
              end_balance,
              shortage,
              stock_end_amount,
              forward_payments_end_amount,
            } = prevPeriod

            const newPeriod: FinancePeriod = {
              id: uuidv4(),
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

            periods.push(newPeriod)
          }
        } else {
          throw new Error(
            `Action payload provided incorrectly: ${action.payload}`,
          )
        }
      },
    ),
    changeStartDate: create.reducer(
      (
        periods,
        action: PayloadAction<{
          periodId: FinancePeriod["id"]
          newStartDate: FinancePeriod["start_date"]
        }>,
      ) => {
        // update start date, days_to_new_period
        const indexOfPeriodToUpdate = periods.findIndex(
          p => p.id === action.payload.periodId,
        )
        const currentPeriod = periods[indexOfPeriodToUpdate]
        const nextPeriodStartDate =
          periods[indexOfPeriodToUpdate + 1].start_date
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
  }),
  selectors: {
    selectPeriods: state => state,
  },
})

export const { addPeriod, changeStartDate } = periodsSlice.actions
export const { selectPeriods } = periodsSlice.selectors
export default periodsSlice.reducer
