import { type FunctionComponent } from "react"
import CashFlowListItem from "./CashFlowItem"
import { type VariablePaymentsT } from "./Forecast"

interface VariablePaymentsProps {
  payments: VariablePaymentsT
  sum: number
}

const VariablePayments: FunctionComponent<VariablePaymentsProps> = ({
  payments,
  sum,
}) => {
  return (
    <div className="variable">
      <h4>Остальные траты: {sum} руб.</h4>
      <ul>
        {payments.map(payment => (
          <CashFlowListItem key={payment.id} {...payment} />
        ))}
      </ul>
    </div>
  )
}

export default VariablePayments
