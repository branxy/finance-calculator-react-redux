import { type FunctionComponent } from "react"
import type { FinancePeriod } from "../finance-periods/types"
import AddTransaction from "./AddTransaction"
import { Heading } from "@radix-ui/themes"

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
      <Heading as="h4" size="3">
        Expences
      </Heading>
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
