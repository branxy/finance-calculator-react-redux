import { type FunctionComponent } from "react"
import type {} from "../types"
import CashFlowListItem from "./CashFlowItem"
import { type FixedPaymentsT } from "./Forecast"

interface FixedPaymentsProps {
  payments: FixedPaymentsT
  sum: number
}

const FixedPayments: FunctionComponent<FixedPaymentsProps> = ({
  payments,
  sum,
}) => {
  return (
    <div className="fixed">
      <h4>Обязательные платежи: {sum} руб.</h4>
      <ul>
        {payments.map(payment => (
          <CashFlowListItem key={payment.id} {...payment} />
        ))}
      </ul>
    </div>
  )
}

export default FixedPayments
