import { type FunctionComponent } from "react"
import type { CashFlow } from "../types"
import CashFlowListItem from "./CashFlowItem"

interface VariablePaymentsProps {
  payments: CashFlow["payments"]["variable"]
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
