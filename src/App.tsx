import "./App.css"
import { useAppDispatch, useAppSelector } from "./app/hooks"
import { addPeriod } from "./features/finance-periods/periodsSlice"

const App = () => {
  const dispatch = useAppDispatch()
  const financePeriods = useAppSelector(state => state.periods)
  return (
    <div className="App">
      <h1>Finance tracker</h1>
    </div>
  )
}

export default App
