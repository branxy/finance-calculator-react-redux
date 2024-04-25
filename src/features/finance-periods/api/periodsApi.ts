import { getTodayDate } from "../../../utils"
import {
  type PaymentSubmittedUpdates,
  type ValuesToUpdate,
} from "../period/periodsSlice"
import type { FinancePeriod, Periods } from "../types"
import { v4 as uuidv4 } from "uuid"

const samplePeriod: FinancePeriod = {
  id: "2",
  user_id: uuidv4(),
  start_date: getTodayDate(),
  start_balance: 377000,
  end_balance: 377000,
  stock_start_amount: 6000,
  stock_end_amount: 6000,
  forward_payments_start_amount: 12000,
  forward_payments_end_amount: 12000,
}

export async function uploadPeriod(
  period: Omit<FinancePeriod, "id">,
): Promise<FinancePeriod> {
  const id = uuidv4()
  const newPeriod: FinancePeriod = { id, ...period }
  return new Promise(resolve => resolve(newPeriod))
}

export async function updateStartDate(
  periodId: FinancePeriod["id"],
  newStartDate: FinancePeriod["start_date"],
  period: FinancePeriod,
): Promise<FinancePeriod> {
  const updatedPeriod = { ...period, start_date: newStartDate }

  return new Promise(resolve => resolve(updatedPeriod))
}

export async function updatePeriodsBalance(
  periodsToUpdate: ValuesToUpdate,
): Promise<ValuesToUpdate> {
  return new Promise(resolve => resolve(periodsToUpdate))
}

export async function updateCompensation(
  periodsToUpdate: PaymentSubmittedUpdates,
): Promise<PaymentSubmittedUpdates> {
  return new Promise(resolve => resolve(periodsToUpdate))
}
