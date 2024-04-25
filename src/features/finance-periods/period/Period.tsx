import { useState, type FunctionComponent } from "react"
import type { Cashflow, FinancePeriod } from "../types"
import { useAppDispatch, useAppSelector } from "../../../app/hooks"
import {
  periodAdded,
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
  selectCashFlowById,
  selectEarningsByPeriodId,
  selectFixedPaymentsByPeriodId,
  selectVariablePaymentsByPeriodId,
} from "../cashflow/cashflowSlice"
import Earnings from "../cashflow/Earnings"
import "./Period.css"
import DaysToNewPeriod from "./DaysToNewPeriod"

interface PeriodProps {
  index: number
  id: FinancePeriod["id"]
  user_id: FinancePeriod["user_id"]
  start_date: FinancePeriod["start_date"]
  start_balance: FinancePeriod["start_balance"]
  end_balance: FinancePeriod["end_balance"]
  stock_end_amount: FinancePeriod["stock_end_amount"]
  forward_payments_end_amount: FinancePeriod["forward_payments_end_amount"]
  forward_payments_start_amount: FinancePeriod["forward_payments_start_amount"]
  daysToNewPeriod: number | undefined
}

const Period: FunctionComponent<PeriodProps> = props => {
  const {
    index,
    id,
    user_id,
    start_date,
    start_balance,
    end_balance,
    stock_end_amount,
    forward_payments_end_amount,
    forward_payments_start_amount,
    daysToNewPeriod,
  } = props
  const [isEditingStartDate, setIsEditingStartDate] = useState(false)
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

  const isntFirstPeriod = index !== 0


  function handleAddFinancePeriod() {
    // check
    dispatch(periodAdded({ prevPeriodId: id, user_id }))
  }

  function handleStartBalanceChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (typeof Number(e.target.value) === "number") {
      const newValue = Number(e.target.value)
      // fix
      dispatch(
        startBalanceChanged({
          periodId: id,
          newStartBalance: newValue,
        }),
      )
    }
  }

  function handleStartDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    // check
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
      {isntFirstPeriod && (
        <div className="earnings">
          <Dropdown title="Доходы" isOpenByDefault={true}>
            <Earnings
              periodId={id}
              earnings={earnings}
              end_balance={end_balance}
            />
          </Dropdown>
        </div>
      )}
      <div className="payments">
        <Dropdown title="Расходы" isOpenByDefault={true}>
          <AddTransaction
            periodId={id}
            transactionType="outcome"
            fixedPaymentsLength={fixedPayments.length}
            variablePaymentsLength={variablePayments.length}
            end_balance={end_balance}
          />
          <Payments
            payments={allPayments}
            fixedPaymentsSum={fixedPaymentsSum}
            variablePaymentsSum={variablePaymentsSum}
          />
        </Dropdown>
      </div>
      <Forecast
        periodId={id}
        start_balance={start_balance}
        end_balance={end_balance}
        earnings={earnings}
        stock={{
          startAmount: stock_end_amount,
          endAmount: stock_end_amount,
        }}
        forwardPayments={{
          startAmount: forward_payments_start_amount,
          endAmount: forward_payments_end_amount,
        }}
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
