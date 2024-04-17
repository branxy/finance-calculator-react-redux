import type { FinancePeriod } from "./features/finance-periods/types"

const today = getTodayDate()

export function getTodayDate() {
  const today = new Date().toISOString().split("T")[0]
  return today
}

export function getDaysBetweenTwoDates(
  lesserDate: FinancePeriod["startDate"],
  greaterDate: FinancePeriod["startDate"] = today,
) {
  const greaterPeriodTimestamp = new Date(greaterDate).getTime()
  const lesserPeriodTimestamp = new Date(lesserDate).getTime()

  const daysBetweenPeriods = Math.floor(
    Math.abs(greaterPeriodTimestamp - lesserPeriodTimestamp) /
      (1000 * 60 * 60 * 24),
  )

  return daysBetweenPeriods
}
