import { Flex, Heading } from "@radix-ui/themes"
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
      <Flex direction="column" align="start" >
        <Heading as="h1" size="7" mt="4">
          Finance tracker
        </Heading>
        {periods}
      </Flex>
    </div>
  )
}

export default App
