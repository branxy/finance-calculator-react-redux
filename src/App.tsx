import "./App.css"
import { useAppDispatch, useAppSelector } from "./app/hooks"
import Period from "./features/finance-periods/Period"
import { addPeriod } from "./features/finance-periods/periodsSlice"

const App = () => {
  const dispatch = useAppDispatch()
  const financePeriods = useAppSelector(state => state.periods)
  const cashFlow = useAppSelector(state => state.cashflow)
  return (
    <div className="App">
      <h1>Finance tracker</h1>
      {financePeriods.map((period, i) => {
        const periodCashFlow = cashFlow.filter(c => c.period_id === period.id)
        return (
          <Period
            key={period.id}
            index={i}
            {...period}
            periodCashflow={periodCashFlow}
          />
        )
      })}
    </div>
  )
}

export default App
