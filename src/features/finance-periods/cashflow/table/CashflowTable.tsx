import { type FunctionComponent } from "react"
import { type EarningsT, type AllPayments } from "../Forecast"
import CashflowTableRow from "./CashflowTableRow"
import "./CashflowTable.css"

export interface CashflowTableProps {
  cashflowType: "payment" | "income"
  tableItems: AllPayments | EarningsT
}

const CashflowTable: FunctionComponent<CashflowTableProps> = ({
  cashflowType,
  tableItems,
}) => {
  // fix
  const isCheckedCheckbox = false

  function handleSelectAll() {}

  const tableContent = tableItems.map(item => (
    <CashflowTableRow
      key={item.id}
      cashflowType={cashflowType}
      casfhlowItemId={item.id}
      periodId={item.period_id}
      title={item.title}
      amount={item.amount}
      date={item.date}
    />
  ))

  return (
    <table className="cashflow-table">
      <colgroup>
        <col className="checkbox" />
        <col className="title" />
        <col className="date" />
        <col className="amount" />
      </colgroup>
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              name="select-all"
              onChange={handleSelectAll}
              checked={isCheckedCheckbox}
            />
          </th>
          <th>Название</th>
          <th>Дата</th>
          <th>Сумма</th>
        </tr>
      </thead>
      <tbody>{tableContent}</tbody>
    </table>
  )
}

export default CashflowTable
