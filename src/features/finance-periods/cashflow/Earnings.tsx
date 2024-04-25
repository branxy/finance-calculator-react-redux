import { type FunctionComponent } from "react"
import type { FinancePeriod } from "../types"
import AddTransaction from "./AddTransaction"
import CashflowTableRow from "./table/CashflowTableRow"
import { type EarningsT } from "./Forecast"
import CashflowTable from "./table/CashflowTable"

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
  const incomeTable = earnings.length > 0 && (
    <CashflowTable cashflowType="income" tableItems={earnings} />
  )

  return (
    <div className="earnings">
      <div className="content">
        <AddTransaction
          periodId={periodId}
          transactionType="income"
          end_balance={end_balance}
        />
        {incomeTable}
      </div>
    </div>
  )
}

export default Earnings
