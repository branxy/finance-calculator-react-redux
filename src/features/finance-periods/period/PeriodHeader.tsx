import { Button, DropdownMenu, Flex, Heading } from "@radix-ui/themes"
import { useState, type FunctionComponent } from "react"
import type { FinancePeriod } from "../types"
import { useAppDispatch, useAppSelector } from "../../../app/hooks"
import { deletedPeriod, startDateChanged } from "./periodsSlice"
import { selectAllCashflowByPeriodId } from "../cashflow/cashflowSlice"

interface PeriodHeaderProps {
  id: FinancePeriod["id"]
  start_date: FinancePeriod["start_date"]
}

const PeriodHeader: FunctionComponent<PeriodHeaderProps> = ({
  id,
  start_date,
}) => {
  const [isEditingStartDate, setIsEditingStartDate] = useState(false)
  const allPeriodCashflow = useAppSelector(state =>
    selectAllCashflowByPeriodId(state, id),
  )
  const dispatch = useAppDispatch()

  function handleStartDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    dispatch(
      startDateChanged({
        periodId: id,
        newStartDate: e.target.value,
      }),
    )
  }

  function handleStartDateKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      setIsEditingStartDate(!isEditingStartDate)
    }
  }

  function handleEditStartDate() {
    setIsEditingStartDate(!isEditingStartDate)
  }

  function handleDeletePeriod() {
    dispatch(deletedPeriod(id))
  }

  return (
    <Flex justify="start" align="center" gap="5" pr="8">
      {isEditingStartDate ? (
        <input
          type="date"
          defaultValue={start_date}
          onChange={handleStartDateChange}
          onKeyDown={handleStartDateKeyDown}
          onBlur={() => setIsEditingStartDate(false)}
          autoFocus={isEditingStartDate}
        />
      ) : (
        <Heading as="h2" size="6" onClick={handleEditStartDate}>
          {start_date}
        </Heading>
      )}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <Button variant="ghost" radius="full">
            <span className="material-symbols-outlined">more_horiz</span>
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item color="red" onClick={handleDeletePeriod}>
            Delete period
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </Flex>
  )
}

export default PeriodHeader
