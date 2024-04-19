import "./App.css"
import { useAppSelector } from "./app/hooks"
import Period from "./features/finance-periods/Period"
import { selectCashFlow } from "./features/finance-periods/cashflow/cashflowSlice"
import { selectPeriods } from "./features/finance-periods/periodsSlice"
import type { CashFlowTable } from "./features/finance-periods/types"

const App = () => {
  const financePeriods = useAppSelector(selectPeriods)
  const cashFlow: CashFlowTable = useAppSelector(selectCashFlow)
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
