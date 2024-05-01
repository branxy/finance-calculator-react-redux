import { type FunctionComponent } from "react"
import type { FinancePeriod } from "../types"
import { type AllPayments, type EarningsT } from "./Forecast"
import Earnings from "./Earnings"
import Payments from "./Payments"
import CashflowTable from "./table/CashflowTable"
import { useAppSelector } from "../../../app/hooks"
import { selectAllCashflowByPeriodId } from "./cashflowSlice"

export interface AllTransactionsProps {
  periodId: FinancePeriod["id"]
  periodIndex: number
  earnings: EarningsT
  end_balance: FinancePeriod["end_balance"]
  allPayments: AllPayments
  fixedPaymentsSum: number
  variablePaymentsSum: number
  fixedPaymentsLength?: number
  variablePaymentsLength?: number
}

const AllTransactions: FunctionComponent<AllTransactionsProps> = ({
  periodId,
  periodIndex,
  earnings,
  end_balance,
  allPayments,
  fixedPaymentsSum,
  variablePaymentsSum,
  fixedPaymentsLength,
  variablePaymentsLength,
}) => {
  const allPeriodCashflow = useAppSelector(state =>
    selectAllCashflowByPeriodId(state, periodId),
  )
  const isntFirstPeriod = periodIndex !== 0

  const cashflowTable = allPeriodCashflow.length > 0 && (
    <CashflowTable
      periodId={periodId}
      tableItems={allPeriodCashflow}
      fixedPaymentsSum={fixedPaymentsSum}
      variablePaymentsSum={variablePaymentsSum}
    />
  )

  return (
    <div className="all-transactions">
      <div className="input">
        {isntFirstPeriod && (
          <div className="earnings">
            <Earnings periodId={periodId} end_balance={end_balance} />
          </div>
        )}
        <Payments
          periodId={periodId}
          fixedPaymentsLength={fixedPaymentsLength}
          variablePaymentsLength={variablePaymentsLength}
          end_balance={end_balance}
        />
      </div>
      {cashflowTable}
    </div>
  )
}

export default AllTransactions
