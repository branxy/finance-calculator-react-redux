import { type FunctionComponent } from "react"
import type { CashFlow } from "../types"
import CashFlowListItem from "./CashFlowItem"

interface FixedPaymentsProps {
  payments: CashFlow["payments"]["fixed"]
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
