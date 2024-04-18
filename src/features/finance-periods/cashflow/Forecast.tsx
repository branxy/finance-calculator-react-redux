import { useState, type FunctionComponent } from "react"
import type { CashFlowItem, FinancePeriod } from "../types"
import { useAppDispatch } from "../../../app/hooks"

export type EarningsT = {
  id: CashFlowItem["id"]
  period_id: CashFlowItem["period_id"]
  type: "earning"
  title: CashFlowItem["title"]
  amount: CashFlowItem["amount"]
  date: CashFlowItem["date"]
}[]

export type FixedPaymentsT = {
  id: CashFlowItem["id"]
  period_id: CashFlowItem["period_id"]
  type: "fixed-payment"
  title: CashFlowItem["title"]
  amount: CashFlowItem["amount"]
  date: CashFlowItem["date"]
}[]

export type VariablePaymentsT = {
  id: CashFlowItem["id"]
  period_id: CashFlowItem["period_id"]
  type: "variable-payment"
  title: CashFlowItem["title"]
  amount: CashFlowItem["amount"]
  date: CashFlowItem["date"]
}[]

interface ForecastProps {
  periodId: FinancePeriod["id"]
  start_balance: FinancePeriod["start_balance"]
  end_balance: FinancePeriod["end_balance"]
  earnings: EarningsT
  stock_end_amount: FinancePeriod["stock_end_amount"]
  forward_payments_end_amount: FinancePeriod["forward_payments_end_amount"]
  fixedPayments: number
  variablePayments: number
  shortage: FinancePeriod["shortage"]
  stock_compensation: FinancePeriod["stock_compensation"]
  forward_payments_compensation: FinancePeriod["forward_payments_compensation"]
}

const Forecast: FunctionComponent<ForecastProps> = ({
  periodId,
  start_balance,
  end_balance,
  earnings,
  stock_end_amount,
  forward_payments_end_amount,
  fixedPayments,
  variablePayments,
  shortage,
  stock_compensation,
  forward_payments_compensation,
}) => {
  const [sumToCompensateStock, setSumToCompensateStock] = useState(0)
  const [sumToCompensateForwardPayments, setSumToCompensateForwardPayments] =
    useState(0)
  const dispatch = useAppDispatch()

  const totalIncome = earnings.reduce((sum, x) => sum + x.amount, 0)
  const compensations = `${
    stock_compensation > 0 ? ` + ${stock_compensation}(НЗ)` : ""
  }${
    forward_payments_compensation > 0
      ? ` + ${forward_payments_compensation}(ОП)`
      : ""
  }`

  function handleSelectCompensation(e: React.ChangeEvent<HTMLInputElement>) {
    switch (e.target.name) {
      case "stock":
        setSumToCompensateStock(Number(e.target.value))
        break
      case "forward-payments":
        setSumToCompensateForwardPayments(Number(e.target.value))
        break
      default:
        throw new Error(`Unknown type of compensation: ${e.target.name}`)
    }
  }

  function handleSubmitCompensation(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (
      sumToCompensateStock + sumToCompensateForwardPayments <=
      Math.abs(shortage)
    ) {
      dispatch({
        type: "submitCompensation",
        periodId,
        compensation: {
          stock: sumToCompensateStock,
          forwardPayments: sumToCompensateForwardPayments,
        },
      })
      setSumToCompensateStock(0)
      setSumToCompensateForwardPayments(0)
    }
  }

  return (
    <div className="forecast">
      <span className="balance">
        Баланс после трат: {start_balance}
        <span>
          {" "}
          + <span className="income">{totalIncome ? totalIncome : "0"}</span>
        </span>{" "}
        - (<span className="payments">{fixedPayments + variablePayments}</span>)
        {compensations} = {end_balance} руб.
      </span>
      <span className="shortage">Недостаток: {Math.abs(shortage)} руб.</span>
      <div className="compensation" id="compensation">
        <span>Способ возмещения:</span>
        <form onSubmit={handleSubmitCompensation}>
          <div className="item">
            <label htmlFor="stock">НЗ: {stock_end_amount} руб.</label>
            {stock_end_amount > 0 && (
              <input
                type="number"
                name="stock"
                value={sumToCompensateStock}
                min="0"
                max={stock_end_amount}
                onChange={handleSelectCompensation}
              />
            )}
          </div>
          <div className="item">
            <label htmlFor="forward-payments">
              Отложенные платежи: {forward_payments_end_amount} руб.
            </label>
            {forward_payments_end_amount > 0 && (
              <input
                type="number"
                name="forward-payments"
                min="0"
                max={forward_payments_end_amount}
                value={sumToCompensateForwardPayments}
                onChange={handleSelectCompensation}
              />
            )}
          </div>
          <button type="submit">Вычесть</button>
        </form>
      </div>
    </div>
  )
}

export default Forecast
