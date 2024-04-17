import { useState, type FunctionComponent } from "react"
import type { CashFlow, FinancePeriod } from "./types"
import { useAppDispatch, useAppSelector } from "../../app/hooks"
import { addPeriod, changeStartDate } from "./periodsSlice"
import Dropdown from "../../components/Dropdown"
import AddTransaction from "./cashflow/AddTransaction"
import Earnings from "./cashflow/Earnings"
import FixedPayments from "./cashflow/FixedPayments"
import VariablePayments from "./cashflow/VariablePayments"
import Forecast from "./cashflow/Forecast"

interface PeriodProps {
  index: number
  id: FinancePeriod["id"]
  startDate: FinancePeriod["startDate"]
  balance: FinancePeriod["balance"]
  shortage: FinancePeriod["shortage"]
  savings: FinancePeriod["savings"]
  compensation: FinancePeriod["compensation"]
  cashFlow: CashFlow
  daysToNewPeriod: FinancePeriod["daysToNewPeriod"]
}

const Period: FunctionComponent<PeriodProps> = props => {
  const [isEditingStartDate, setIsEditingStartDate] = useState(false)
  const financePeriods = useAppSelector(state => state.periods)
  const dispatch = useAppDispatch()

  const {
    index,
    id,
    startDate,
    balance: { startBalance, endBalance },
    shortage,
    savings,
    compensation,
    cashFlow: { earnings, payments },
    daysToNewPeriod,
  } = props

  const fixedPaymentsSum = payments.fixed.reduce((sum, x) => {
    return sum + x.amount
  }, 0)

  const variablePaymentsSum = payments.variable.reduce((sum, x) => {
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
        startBalance: newValue,
        endBalance: newValue,
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
          defaultValue={startDate}
          onChange={handleStartDateChange}
          onBlur={() => setIsEditingStartDate(false)}
          autoFocus={isEditingStartDate}
        />
      ) : (
        <h2 className="title" onClick={handleEditStartDate}>
          {startDate}
        </h2>
      )}
      <div className="balance">
        <span>Стартовый баланс: </span>
        {index === 0 ? (
          <input
            type="number"
            value={startBalance}
            min="1"
            onChange={handleStartBalanceChange}
          />
        ) : (
          <span>{startBalance} руб.</span>
        )}
      </div>
      {typeof daysToNewPeriod === "number" && daysToNewPeriod > 0 && (
        <span className="days">Период: {daysToNewPeriod} дней</span>
      )}
      {isntFirstPeriod && (
        <div className="earnings">
          <Dropdown title="Доходы" isOpenByDefault={true}>
            <Earnings
              periodId={id}
              earnings={earnings}
              endBalance={endBalance}
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
              fixedPaymentsLength={payments.fixed.length}
              variablePaymentsLength={payments.variable.length}
              endBalance={endBalance}
            />
            <div className="payments-list">
              <FixedPayments payments={payments.fixed} sum={fixedPaymentsSum} />
              <VariablePayments
                payments={payments.variable}
                sum={variablePaymentsSum}
              />
            </div>
          </div>
        </Dropdown>
      </div>
      <Forecast
        periodId={id}
        startBalance={startBalance}
        endBalance={endBalance}
        earnings={earnings}
        savings={savings}
        fixedPayments={fixedPaymentsSum}
        variablePayments={variablePaymentsSum}
        shortage={shortage}
        compensation={compensation}
      />
      <button onClick={handleAddFinancePeriod}>
        <span className="material-symbols-outlined">add</span>
        <span>Добавить период</span>
      </button>
    </div>
  )
}

export default Period
