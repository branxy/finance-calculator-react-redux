import { type FunctionComponent } from "react"
import type { CashFlow, FinancePeriod } from "../types"
import AddTransaction from "./AddTransaction"
import CashFlowListItem from "./CashFlowItem"

interface EarningsProps {
  periodId: FinancePeriod["id"]
  earnings: CashFlow["earnings"]
  endBalance: FinancePeriod["balance"]["endBalance"]
}

const Earnings: FunctionComponent<EarningsProps> = ({
  periodId,
  earnings,
  endBalance,
}) => {
  return (
    <div className="earnings">
      <div className="content">
        <AddTransaction
          periodId={periodId}
          transactionType="income"
          endBalance={endBalance}
        />
        {earnings.map(e => (
          <CashFlowListItem key={e.id} {...e} />
        ))}
      </div>
    </div>
  )
}

export default Earnings
