import { useState, type FunctionComponent } from "react"
import type { CashFlowTable, FinancePeriod } from "./types"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import { addPeriod, changeStartDate } from "./periodsSlice"
import Dropdown from "../../components/Dropdown"
import AddTransaction from "./cashflow/AddTransaction"
import FixedPayments from "./cashflow/FixedPayments"
import VariablePayments from "./cashflow/VariablePayments"
import Forecast, {
  type FixedPaymentsT,
  type EarningsT,
  type VariablePaymentsT,
} from "./cashflow/Forecast"
import { selectCashFlowById } from "./cashflow/cashFlowSlice"
import Earnings from "./cashflow/Earnings"
import "./Period.css"
interface PeriodProps {
  index: number
  id: FinancePeriod["id"]
  start_date: FinancePeriod["start_date"]
  start_balance: FinancePeriod["start_balance"]
  end_balance: FinancePeriod["end_balance"]
  shortage: FinancePeriod["shortage"]
  stock_end_amount: FinancePeriod["stock_end_amount"]
  forward_payments_end_amount: FinancePeriod["forward_payments_end_amount"]
  stock_compensation: FinancePeriod["stock_compensation"]
  forward_payments_compensation: FinancePeriod["forward_payments_compensation"]
  days_to_new_period?: FinancePeriod["days_to_new_period"]
  periodCashflow: CashFlowTable
}

const Period: FunctionComponent<PeriodProps> = props => {
  const {
    index,
    id,
    start_date,
    start_balance,
    end_balance,
    stock_end_amount,
    forward_payments_end_amount,
    shortage,
    stock_compensation,
    forward_payments_compensation,
    days_to_new_period,
  } = props
  const [isEditingStartDate, setIsEditingStartDate] = useState(false)
  const financePeriods = useAppSelector(state => state.periods)
  const cashFlow: CashFlowTable = useAppSelector(state =>
    selectCashFlowById(state, id),
  )
  const dispatch = useAppDispatch()

  console.log({ cashFlow })

  const earnings = cashFlow.filter(c => c.type === "earning") as EarningsT
  const fixedPayments = [
    ...cashFlow.filter(c => c.type === "fixed-payment"),
  ] as FixedPaymentsT
  const fixedPaymentsSum = fixedPayments.reduce((sum, x) => {
    return sum + x.amount
  }, 0)

  const variablePayments = cashFlow.filter(
    c => c.type === "variable-payment",
  ) as VariablePaymentsT
  const variablePaymentsSum = variablePayments.reduce((sum, x) => {
    return sum + x.amount
  }, 0)

  const isntFirstPeriod = index !== 0

  function handleAddFinancePeriod() {
    // check
    dispatch(addPeriod(id))
  }

  function handleStartBalanceChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (typeof Number(e.target.value) === "number" && financePeriods) {
      const newValue = Number(e.target.value)
      // fix
      dispatch({
        type: "changedStartBalance",
        periodId: id,
        start_balance: newValue,
        end_balance: newValue,
      })
    }
  }

  function handleStartDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    // check
    dispatch(
      changeStartDate({
        periodId: id,
        newStartDate: e.target.value,
      }),
    )
  }

  function handleEditStartDate() {
    setIsEditingStartDate(!isEditingStartDate)
  }

  return (
    <div className="period">
      {isEditingStartDate ? (
        <input
          type="date"
          defaultValue={start_date}
          onChange={handleStartDateChange}
          onBlur={() => setIsEditingStartDate(false)}
          autoFocus={isEditingStartDate}
        />
      ) : (
        <h2 className="title" onClick={handleEditStartDate}>
          {start_date}
        </h2>
      )}
      <div className="balance">
        <span>Стартовый баланс: </span>
        {index === 0 ? (
          <input
            type="number"
            value={start_balance}
            min="1"
            onChange={handleStartBalanceChange}
          />
        ) : (
          <span>{start_balance} руб.</span>
        )}
      </div>
      {typeof days_to_new_period === "number" && days_to_new_period > 0 && (
        <span className="days">Период: {days_to_new_period} дней</span>
      )}
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
          <div className="payments-content">
            <AddTransaction
              periodId={id}
              transactionType="outcome"
              fixedPaymentsLength={fixedPayments.length}
              variablePaymentsLength={variablePayments.length}
              end_balance={end_balance}
            />
            <div className="payments-list">
              <FixedPayments payments={fixedPayments} sum={fixedPaymentsSum} />
              <VariablePayments
                payments={variablePayments}
                sum={variablePaymentsSum}
              />
            </div>
          </div>
        </Dropdown>
      </div>
      <Forecast
        periodId={id}
        start_balance={start_balance}
        end_balance={end_balance}
        earnings={earnings}
        stock_end_amount={stock_end_amount}
        forward_payments_end_amount={forward_payments_end_amount}
        fixedPayments={fixedPaymentsSum}
        variablePayments={variablePaymentsSum}
        shortage={shortage}
        stock_compensation={stock_compensation}
        forward_payments_compensation={forward_payments_compensation}
      />
      <button onClick={handleAddFinancePeriod}>
        <span className="material-symbols-outlined">add</span>
        <span>Добавить период</span>
      </button>
    </div>
  )
}

export default Period
