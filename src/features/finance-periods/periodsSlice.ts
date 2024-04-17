import { getDaysBetweenTwoDates, getTodayDate } from "../../utils"
import type { Periods, FinancePeriod } from "./types"
import { v4 as uuidv4 } from "uuid"
import { createAppSlice } from "../../app/createAppSlice"
import { type PayloadAction } from "@reduxjs/toolkit"

const initialState: Periods = [
  {
    id: "1",
    startDate: getTodayDate(),
    daysToNewPeriod: undefined,
    balance: {
      startBalance: 0,
      endBalance: 0,
    },
    shortage: 0,
    savings: {
      stock: {
        startAmount: 6000,
        endAmount: 6000,
      },
      forwardPayments: {
        startAmount: 12000,
        endAmount: 12000,
      },
    },
    compensation: {
      stock: 0,
      forwardPayments: 0,
    },
  },
]

export const periodsSlice = createAppSlice({
  name: "periods",
  initialState,
  reducers: create => ({
    addPeriod: create.reducer(
      (periods, action: PayloadAction<FinancePeriod["id"]>) => {
        // updates previous periods' daysToNewPeriod
        if (typeof action.payload === "string") {
          const prevPeriod = periods.find(p => p.id === action.payload)
          if (prevPeriod) {
            // const currentPeriodTimestamp = new Date(getTodayDate()).getTime()
            // const prevPeriodTimestamp = new Date(prevPeriod.startDate).getTime()
            const newDaysToNewPeriod = getDaysBetweenTwoDates(
              prevPeriod.startDate,
            )
            console.log({ newDaysToNewPeriod })
            prevPeriod.daysToNewPeriod = newDaysToNewPeriod

            // adds new period to state
            const prevEndBalance = prevPeriod.balance.endBalance
            const prevShortage = prevPeriod.shortage
            const prevSavings = prevPeriod.savings

            const newPeriod: FinancePeriod = {
              id: uuidv4(),
              startDate: prevPeriod.startDate,
              daysToNewPeriod: undefined,
              balance: {
                startBalance: prevEndBalance,
                endBalance: prevEndBalance,
              },
              shortage: prevShortage,
              savings: {
                stock: {
                  startAmount: prevSavings.stock.endAmount,
                  endAmount: prevSavings.stock.endAmount,
                },
                forwardPayments: {
                  startAmount: prevSavings.forwardPayments.endAmount,
                  endAmount: prevSavings.forwardPayments.endAmount,
                },
              },
              compensation: {
                stock: 0,
                forwardPayments: 0,
              },
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
    // changePeriod: create.reducer(
    //   (periods, action: PayloadAction<FinancePeriod>) => {
    //     const indexOfPeriodToUpdate = periods.findIndex(
    //       p => p.id === action.payload.id,
    //     )

    //     state[indexOfPeriodToUpdate] = action.payload
    //   },
    // ),
    changeStartDate: create.reducer(
      (
        periods,
        action: PayloadAction<{
          periodId: FinancePeriod["id"]
          newStartDate: FinancePeriod["startDate"]
        }>,
      ) => {
        // update start date, daysToNewPeriod
        const indexOfPeriodToUpdate = periods.findIndex(
          p => p.id === action.payload.periodId,
        )
        const currentPeriod = periods[indexOfPeriodToUpdate]
        const nextPeriodStartDate = periods[indexOfPeriodToUpdate + 1].startDate
        currentPeriod.startDate = action.payload.newStartDate

        if (nextPeriodStartDate) {
          // update daysToNewPeriod
          currentPeriod.daysToNewPeriod = getDaysBetweenTwoDates(
            currentPeriod.startDate,
            nextPeriodStartDate,
          )
        }
      },
    ),
  }),
  selectors: {
    selectBalance: (periods, periodId) =>
      periods.find(p => p.id === periodId)?.balance,
  },
})

export const { addPeriod, changeStartDate } = periodsSlice.actions
export const { selectBalance } = periodsSlice.selectors
export default periodsSlice.reducer
