import { getTodayDate } from "../../../utils"
import {
  CompensationsToUpdate,
  type PaymentSubmittedUpdates,
  type ValuesToUpdate,
} from "../period/periodsSlice"
import type { FinancePeriod, Periods, StockCompensations } from "../types"
import { v4 as uuidv4 } from "uuid"

const samplePeriod: FinancePeriod = {
  id: "2",
  user_id: uuidv4(),
  start_date: getTodayDate(),
  start_balance: 377000,
  end_balance: 377000,
  stock: 6000,
  forward_payments: 12000,
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

export async function uploadNewSavings(
  valuesToUpdate: CompensationsToUpdate,
): Promise<CompensationsToUpdate> {
  return new Promise(resolve => resolve(valuesToUpdate))
}
