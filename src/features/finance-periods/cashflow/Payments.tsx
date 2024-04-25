import { type FunctionComponent } from "react"
import type {} from "../types"
import { type AllPayments } from "./Forecast"
import CashflowTable from "./table/CashflowTable"

interface FixedPaymentsProps {
  payments: AllPayments
  fixedPaymentsSum: number
  variablePaymentsSum: number
}

const Payments: FunctionComponent<FixedPaymentsProps> = ({
  payments,
  fixedPaymentsSum,
  variablePaymentsSum,
}) => {
  const paymentsTable = payments.length > 0 && (
    <CashflowTable cashflowType="payment" tableItems={payments} />
  )

  return (
    <div className="list">
      {fixedPaymentsSum > 0 && (
        <p>Обязательные платежи: {fixedPaymentsSum} руб.</p>
      )}
      {variablePaymentsSum > 0 && (
        <p>Остальные платежи: {variablePaymentsSum} руб.</p>
      )}
      {paymentsTable}
    </div>
  )
}

export default Payments
