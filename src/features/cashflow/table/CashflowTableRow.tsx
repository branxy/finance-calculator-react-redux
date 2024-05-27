import { type FunctionComponent } from "react"
import type { CashflowItem, FinancePeriod } from "../../finance-periods/types"
import EditableTableCell from "./EditableTableCell"

interface CashflowTableRowProps {
  cashflowType: CashflowItem["type"]
  casfhlowItemId: CashflowItem["id"]
  periodId: CashflowItem["period_id"]
  title: CashflowItem["title"]
  amount: CashflowItem["amount"]
  date: CashflowItem["date"]
  selectedTransactions: FinancePeriod["id"][]
  handleSelectTransaction: (periodId: FinancePeriod["id"]) => void
}

const CashflowTableRow: FunctionComponent<CashflowTableRowProps> = ({
  cashflowType,
  casfhlowItemId,
  periodId,
  title,
  amount,
  date,
  selectedTransactions,
  handleSelectTransaction,
}) => {
  const isSelectedRow = Boolean(
    selectedTransactions?.find(id => id === casfhlowItemId),
  )

  return (
    <tr className={`cashflow-item ${isSelectedRow ? "selected" : ""}`}>
      <td>
        <input
          type="checkbox"
          name="select-cashflow-item"
          id="select-cashflow-item"
          aria-label={`Select ${cashflowType}`}
          onChange={() => handleSelectTransaction(casfhlowItemId)}
          checked={isSelectedRow}
        />
      </td>
      <EditableTableCell
        cashflowItemId={casfhlowItemId}
        cellType="title"
        cellValue={title}
      />
      <EditableTableCell
        cashflowItemId={casfhlowItemId}
        cellType="date"
        cellValue={date}
      />
      <EditableTableCell
        cashflowItemId={casfhlowItemId}
        cellType="amount"
        cellValue={amount}
      />
    </tr>
  )
}

export default CashflowTableRow
