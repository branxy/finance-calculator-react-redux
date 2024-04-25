import { type FunctionComponent } from "react"
import type { CashflowItem } from "../../types"
import { type CashflowTableProps } from "./CashflowTable"
import EditableTableCell from "./EditableTableCell"

interface CashflowTableRowProps {
  cashflowType: CashflowTableProps["cashflowType"]
  casfhlowItemId: CashflowItem["id"]
  periodId: CashflowItem["period_id"]
  title: CashflowItem["title"]
  amount: CashflowItem["amount"]
  date: CashflowItem["date"]
}

const CashflowTableRow: FunctionComponent<CashflowTableRowProps> = ({
  cashflowType,
  casfhlowItemId,
  periodId,
  title,
  amount,
  date,
}) => {
  const shortenedDate = new Date(date).toLocaleDateString().slice(0, 5)

  return (
    <tr className="cashflow-item">
      <td>
        <input
          type="checkbox"
          name="select-cashflow-item"
          aria-label={`Select ${cashflowType}`}
        />
      </td>
      <EditableTableCell
        cashflowType={cashflowType}
        cashflowItemId={casfhlowItemId}
        cellType="title"
        cellValue={title}
      />
      <EditableTableCell
        cashflowType={cashflowType}
        cashflowItemId={casfhlowItemId}
        cellType="date"
        cellValue={date}
      />
      <EditableTableCell
        cashflowType={cashflowType}
        cashflowItemId={casfhlowItemId}
        cellType="amount"
        cellValue={amount}
      />
    </tr>
  )
}

export default CashflowTableRow
