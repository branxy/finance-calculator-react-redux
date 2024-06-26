import { type FunctionComponent } from "react"
import { useAppSelector } from "../../../app/hooks"
import { selectPeriodStartDateByIndex } from "./periodsSlice"

interface DaysToNewPeriodProps {
  periodIndex: number
  daysToNewPeriod: number | undefined
}

const DaysToNewPeriod: FunctionComponent<DaysToNewPeriodProps> = ({
  periodIndex,
  daysToNewPeriod,
}) => {
  const nextPeriodStartDate = useAppSelector(state =>
    selectPeriodStartDateByIndex(state, periodIndex + 1),
  )

  if (typeof daysToNewPeriod === "number") {
    if (daysToNewPeriod > 0) {
      return <span className="days">Period: {daysToNewPeriod} days</span>
    } else if (daysToNewPeriod < 0 && nextPeriodStartDate) {
      return (
        <span className="error">
          The date of the current period can't be later than the next one's:{" "}
          {nextPeriodStartDate}
        </span>
      )
    }
  }
}

export default DaysToNewPeriod
