import { type FunctionComponent } from "react"
import type { FinancePeriod } from "../types"
import AddTransaction from "./AddTransaction"

interface EarningsProps {
  periodId: FinancePeriod["id"]
  end_balance: FinancePeriod["end_balance"]
}

const Earnings: FunctionComponent<EarningsProps> = ({
  periodId,
  end_balance,
}) => {
  return (
    <div className="earnings">
      <h4>Доходы</h4>
      <div className="content">
        <AddTransaction
          periodId={periodId}
          transactionType="income"
          end_balance={end_balance}
        />
      </div>
    </div>
  )
}

export default Earnings
