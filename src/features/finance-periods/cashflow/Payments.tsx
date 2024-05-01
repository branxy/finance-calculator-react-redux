import { type FunctionComponent } from "react"
import type { FinancePeriod } from "../types"
import AddTransaction from "./AddTransaction"

interface FixedPaymentsProps {
  periodId: FinancePeriod["id"]
  fixedPaymentsLength?: number
  variablePaymentsLength?: number
  end_balance: FinancePeriod["end_balance"]
}

const Payments: FunctionComponent<FixedPaymentsProps> = ({
  periodId,
  fixedPaymentsLength,
  variablePaymentsLength,
  end_balance,
}) => {
  return (
    <div className="payments">
      <h4>Расходы</h4>
      <AddTransaction
        periodId={periodId}
        transactionType="outcome"
        fixedPaymentsLength={fixedPaymentsLength}
        variablePaymentsLength={variablePaymentsLength}
        end_balance={end_balance}
      />
    </div>
  )
}

export default Payments
