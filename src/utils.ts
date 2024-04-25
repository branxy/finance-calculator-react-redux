import type { FinancePeriod } from "./features/finance-periods/types"

const today = getTodayDate()

export function getTodayDate() {
  const today = new Date().toISOString().split("T")[0]
  return today
}

export function getDaysBetweenTwoDates(
  lesserDate: FinancePeriod["start_date"],
  greaterDate?: FinancePeriod["start_date"],
): number | undefined {
  if (!greaterDate) return undefined

  const greaterPeriodTimestamp = new Date(greaterDate).getTime()
  const lesserPeriodTimestamp = new Date(lesserDate).getTime()

  const daysBetweenPeriods = Math.floor(
    (greaterPeriodTimestamp - lesserPeriodTimestamp) / (1000 * 60 * 60 * 24),
  )
  console.log({ daysBetweenPeriods })
  return daysBetweenPeriods
}

function calculatePeriodEndBalance() {}
