import { useState, type FunctionComponent } from "react"
import CashflowTableRow from "./CashflowTableRow"
import "./CashflowTable.css"
import { type AllTransactionsProps } from "../AllTransactions"
import type { Cashflow, CashflowItem, FinancePeriod } from "../../types"
import CashflowTableActionButtons from "./CashflowTableActionButtons"

export interface CashflowTableProps {
  periodId: FinancePeriod["id"]
  tableItems: Cashflow
  fixedPaymentsSum: AllTransactionsProps["fixedPaymentsSum"]
  variablePaymentsSum: AllTransactionsProps["fixedPaymentsSum"]
}

const CashflowTable: FunctionComponent<CashflowTableProps> = ({
  periodId,
  tableItems,
  fixedPaymentsSum,
  variablePaymentsSum,
}) => {
  const [selectedTransactions, setSelectedTransactions] = useState<
    CashflowItem["id"][]
  >([])

  const isCheckedCheckbox =
    selectedTransactions.length === tableItems.length &&
    selectedTransactions.length > 0

  function handleSelectTransaction(cashflowItemId: CashflowItem["id"]) {
    if (!selectedTransactions.length) {
      setSelectedTransactions([cashflowItemId])
    } else if (!selectedTransactions.includes(cashflowItemId)) {
      setSelectedTransactions(prev => [...prev, cashflowItemId])
    } else {
      setSelectedTransactions(prev => prev.filter(id => id !== cashflowItemId))
    }
  }

  function handleSelectAllTransactions() {
    if (selectedTransactions.length < tableItems.length) {
      const allTransactionsIds = tableItems.map(i => i.id)
      setSelectedTransactions(allTransactionsIds)
    } else setSelectedTransactions([])
  }

  const tableContent = tableItems.map(item => (
    <CashflowTableRow
      key={item.id}
      cashflowType={item.type}
      casfhlowItemId={item.id}
      periodId={item.period_id}
      title={item.title}
      amount={item.amount}
      date={item.date}
      selectedTransactions={selectedTransactions}
      handleSelectTransaction={handleSelectTransaction}
    />
  ))

  return (
    <div className="list">
      {fixedPaymentsSum > 0 && (
        <p>Обязательные платежи: {fixedPaymentsSum} руб.</p>
      )}
      {variablePaymentsSum > 0 && (
        <p>Остальные платежи: {variablePaymentsSum} руб.</p>
      )}
      <CashflowTableActionButtons
        periodId={periodId}
        selectedTransactions={selectedTransactions}
        setSelectedTransactions={setSelectedTransactions}
      />
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
                id="select-all"
                onChange={handleSelectAllTransactions}
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
    </div>
  )
}

export default CashflowTable
