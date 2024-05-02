import "./App.css"
import { useAppSelector } from "./app/hooks"
import Period from "./features/finance-periods/period/Period"
import { selectAllPeriods } from "./features/finance-periods/period/periodsSlice"
import { getDaysBetweenTwoDates } from "./utils"

const App = () => {
  const financePeriods = useAppSelector(selectAllPeriods)

  const periods = financePeriods.map((period, i, arr) => {
    const daysToNewPeriod = getDaysBetweenTwoDates(
      period.start_date,
      arr[i + 1]?.start_date,
    )
    return (
      <Period
        key={period.id}
        id={period.id}
        index={i}
        daysToNewPeriod={daysToNewPeriod}
      />
    )
  })

  return (
    <div className="App">
      <h1>Finance tracker</h1>
      {periods}
    </div>
  )
}

export default App
