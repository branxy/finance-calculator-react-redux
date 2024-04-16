import getTodayDate from "../../utils"
import { type FinancePeriod } from "./types"
import { v4 as uuidv4 } from "uuid"

const initialState: FinancePeriod = {
  id: uuidv4(),
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
}
