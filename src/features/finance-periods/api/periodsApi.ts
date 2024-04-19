import { getTodayDate } from "../../../utils"
import type { FinancePeriod } from "../types"
import { v4 as uuidv4 } from "uuid"

const samplePeriod: FinancePeriod = {
  id: "2",
  user_id: uuidv4(),
  start_date: getTodayDate(),
  days_to_new_period: undefined,
  start_balance: 377000,
  end_balance: 377000,
  shortage: 0,
  stock_start_amount: 6000,
  stock_end_amount: 6000,
  forward_payments_start_amount: 12000,
  forward_payments_end_amount: 12000,
  stock_compensation: 0,
  forward_payments_compensation: 0,
}

export async function uploadPeriod(
  period: Omit<FinancePeriod, "id">,
): Promise<FinancePeriod> {
  const id = uuidv4()
  const newPeriod: FinancePeriod = { id, ...period }
  return new Promise(resolve => resolve(newPeriod))
}

export async function updatePeriod(
  period: FinancePeriod,
  periodId: FinancePeriod["id"],
  newStartDate: FinancePeriod["start_date"],
  days_to_new_period?: FinancePeriod["days_to_new_period"],
): Promise<FinancePeriod> {
  let updatedPeriod: FinancePeriod

  if (days_to_new_period) {
    updatedPeriod = { ...period, start_date: newStartDate, days_to_new_period }
  } else {
    updatedPeriod = { ...period, start_date: newStartDate }
  }

  return new Promise(resolve => resolve(updatedPeriod))
}
