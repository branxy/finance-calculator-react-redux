import { useState, type FunctionComponent } from "react"
import type { FinancePeriod } from "../types"
import { useAppDispatch, useAppSelector } from "../../../app/hooks"
import {
  periodAdded,
  selectPeriodByIndex,
  startBalanceChanged,
  startDateChanged,
} from "./periodsSlice"
import Dropdown from "../../../components/Dropdown"
import AddTransaction from "../cashflow/AddTransaction"
import Payments from "../cashflow/Payments"
import Forecast, {
  type FixedPaymentsT,
  type EarningsT,
  type VariablePaymentsT,
  type AllPayments,
} from "../cashflow/Forecast"
import {
  selectAllPaymentsByPeriodId,
  selectEarningsByPeriodId,
  selectFixedPaymentsByPeriodId,
  selectVariablePaymentsByPeriodId,
} from "../cashflow/cashflowSlice"
import Earnings from "../cashflow/Earnings"
import "./Period.css"
import DaysToNewPeriod from "./DaysToNewPeriod"
import AllTransactions from "../cashflow/AllTransactions"

interface PeriodProps {
  index: number
  daysToNewPeriod: number | undefined
}

const Period: FunctionComponent<PeriodProps> = props => {
  const { index, daysToNewPeriod } = props
  const [isEditingStartDate, setIsEditingStartDate] = useState(false)
  const period = useAppSelector(state => selectPeriodByIndex(state, index))
  const {
    id,
    user_id,
    start_date,
    start_balance,
    end_balance,
    stock,
    forward_payments,
  } = period
  const earnings = useAppSelector(state =>
    selectEarningsByPeriodId(state, id),
  ) as EarningsT
  const allPayments = useAppSelector(state =>
    selectAllPaymentsByPeriodId(state, id),
  ) as AllPayments

  const fixedPayments = useAppSelector(state =>
    selectFixedPaymentsByPeriodId(state, id),
  ) as FixedPaymentsT
  const variablePayments = useAppSelector(state =>
    selectVariablePaymentsByPeriodId(state, id),
  ) as VariablePaymentsT
  const dispatch = useAppDispatch()

  const fixedPaymentsSum = fixedPayments.reduce((sum, x) => {
    return sum + x.amount
  }, 0)

  const variablePaymentsSum = variablePayments.reduce((sum, x) => {
    return sum + x.amount
  }, 0)

  function handleAddFinancePeriod() {
    dispatch(periodAdded({ prevPeriodId: id, user_id }))
  }

  function handleStartBalanceChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (typeof Number(e.target.value) === "number") {
      const newValue = Number(e.target.value)
      dispatch(
        startBalanceChanged({
          periodId: id,
          newStartBalance: newValue,
        }),
      )
    }
  }

  function handleStartDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    dispatch(
      startDateChanged({
        periodId: id,
        newStartDate: e.target.value,
      }),
    )
  }

  function handleStartDateKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      setIsEditingStartDate(!isEditingStartDate)
    }
  }

  function handleEditStartDate() {
    setIsEditingStartDate(!isEditingStartDate)
  }

  return (
    <div className="period">
      <div className="period-title">
        {isEditingStartDate ? (
          <input
            type="date"
            defaultValue={start_date}
            onChange={handleStartDateChange}
            onKeyDown={handleStartDateKeyDown}
            onBlur={() => setIsEditingStartDate(false)}
            autoFocus={isEditingStartDate}
          />
        ) : (
          <h2 className="title" onClick={handleEditStartDate}>
            {start_date}
          </h2>
        )}
      </div>
      <div className="balance">
        <span>Стартовый баланс: </span>
        {index === 0 ? (
          <input
            type="number"
            name="start-balance"
            value={start_balance}
            min="1"
            onFocus={e => e.target.select()}
            onChange={handleStartBalanceChange}
          />
        ) : (
          <span>{start_balance} руб.</span>
        )}
      </div>
      <DaysToNewPeriod periodIndex={index} daysToNewPeriod={daysToNewPeriod} />
      <Dropdown title="Оборот" isOpenByDefault={true}>
        <AllTransactions
          periodId={id}
          periodIndex={index}
          earnings={earnings}
          end_balance={end_balance}
          allPayments={allPayments}
          fixedPaymentsSum={fixedPaymentsSum}
          variablePaymentsSum={variablePaymentsSum}
          fixedPaymentsLength={fixedPayments.length}
          variablePaymentsLength={variablePayments.length}
        />
      </Dropdown>
      <Forecast
        periodId={id}
        start_balance={start_balance}
        end_balance={end_balance}
        earnings={earnings}
        stock={stock}
        forwardPayments={forward_payments}
        fixedPayments={fixedPaymentsSum}
        variablePayments={variablePaymentsSum}
      />
      <button onClick={handleAddFinancePeriod}>
        <span className="material-symbols-outlined">add</span>
        <span>Добавить период</span>
      </button>
    </div>
  )
}

export default Period
