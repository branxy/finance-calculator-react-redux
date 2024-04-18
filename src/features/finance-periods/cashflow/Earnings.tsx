import { type FunctionComponent } from "react"
import type { FinancePeriod } from "../types"
import AddTransaction from "./AddTransaction"
import CashFlowListItem from "./CashFlowItem"
import { type EarningsT } from "./Forecast"

interface EarningsProps {
  periodId: FinancePeriod["id"]
  earnings: EarningsT
  end_balance: FinancePeriod["end_balance"]
}

const Earnings: FunctionComponent<EarningsProps> = ({
  periodId,
  earnings,
  end_balance,
}) => {
  return (
    <div className="earnings">
      <div className="content">
        <AddTransaction
          periodId={periodId}
          transactionType="income"
          end_balance={end_balance}
        />
        {earnings.map(e => (
          <CashFlowListItem key={e.id} {...e} />
        ))}
      </div>
    </div>
  )
}

export default Earnings
