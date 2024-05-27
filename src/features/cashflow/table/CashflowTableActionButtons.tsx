import { Button } from "@radix-ui/themes"

import { type FunctionComponent } from "react"
import type { CashflowItem, FinancePeriod } from "../../finance-periods/types"

import { deletedCashflowItems } from "../cashflowSlice"
import { useAppDispatch } from "../../../app/hooks"

interface CashflowTableActionButtonsProps {
  periodId: FinancePeriod["id"]
  selectedTransactions: CashflowItem["id"][]
  setSelectedTransactions: React.Dispatch<React.SetStateAction<string[]>>
}

const CashflowTableActionButtons: FunctionComponent<
  CashflowTableActionButtonsProps
> = ({ periodId, selectedTransactions, setSelectedTransactions }) => {
  const dispatch = useAppDispatch()
  const noRowsSelected = selectedTransactions.length === 0

  function handleDeleteCashflowItems() {
    dispatch(
      deletedCashflowItems({
        periodId,
        currentPeriodWasDeleted: false,
        selectedTransactions,
      }),
    )
    setSelectedTransactions([])
  }
  return (
    <div className="action-btns">
      <Button
        variant="surface"
        disabled={noRowsSelected}
        onClick={handleDeleteCashflowItems}
      >
        <span className="material-symbols-outlined">delete</span>
      </Button>
    </div>
  )
}

export default CashflowTableActionButtons
