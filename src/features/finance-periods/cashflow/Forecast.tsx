import { useState, type FunctionComponent } from "react"
import type { CashflowItem, FinancePeriod } from "../types"
import { useAppDispatch } from "../../../app/hooks"
import "./Forecast.css"

export type EarningsT = {
  id: CashflowItem["id"]
  period_id: CashflowItem["period_id"]
  type: "earning"
  title: CashflowItem["title"]
  amount: CashflowItem["amount"]
  date: CashflowItem["date"]
}[]

export type FixedPaymentsT = {
  id: CashflowItem["id"]
  period_id: CashflowItem["period_id"]
  type: "fixed-payment"
  title: CashflowItem["title"]
  amount: CashflowItem["amount"]
  date: CashflowItem["date"]
}[]

export type VariablePaymentsT = {
  id: CashflowItem["id"]
  period_id: CashflowItem["period_id"]
  type: "variable-payment"
  title: CashflowItem["title"]
  amount: CashflowItem["amount"]
  date: CashflowItem["date"]
}[]

interface ForecastProps {
  periodId: FinancePeriod["id"]
  start_balance: FinancePeriod["start_balance"]
  end_balance: FinancePeriod["end_balance"]
  earnings: EarningsT
  stock: {
    startAmount: FinancePeriod["stock_start_amount"]
    endAmount: FinancePeriod["stock_end_amount"]
  }
  forwardPayments: {
    startAmount: FinancePeriod["forward_payments_start_amount"]
    endAmount: FinancePeriod["forward_payments_end_amount"]
  }
  fixedPayments: number
  variablePayments: number
}

const Forecast: FunctionComponent<ForecastProps> = ({
  periodId,
  start_balance,
  end_balance,
  earnings,
  stock,
  forwardPayments,
  fixedPayments,
  variablePayments,
}) => {
  const [sumToCompensateStock, setSumToCompensateStock] = useState(0)
  const [sumToCompensateForwardPayments, setSumToCompensateForwardPayments] =
    useState(0)
  const dispatch = useAppDispatch()

  const totalIncome = earnings.reduce((sum, x) => sum + x.amount, 0)
  const stockCompensationsAmnt = stock.endAmount - stock.startAmount
  const forwardPaymentsCompensationsAmnt =
    forwardPayments.endAmount - forwardPayments.startAmount
  const compensations = `${stockCompensationsAmnt > 0 ? stockCompensationsAmnt : ""} ${forwardPaymentsCompensationsAmnt > 0 ? forwardPaymentsCompensationsAmnt : ""}`
  const shortage = end_balance < 0 ? Math.abs(end_balance) : 0

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
      <span className="shortage">Недостаток: {shortage} руб.</span>
      <div className="compensation" id="compensation">
        <span>Способ возмещения:</span>
        <form onSubmit={handleSubmitCompensation}>
          <div className="item">
            <label htmlFor="stock">НЗ: {stock.endAmount} руб.</label>
            {stock.endAmount > 0 && (
              <input
                type="number"
                name="stock"
                value={sumToCompensateStock}
                min="0"
                max={stock.endAmount}
                onChange={handleSelectCompensation}
              />
            )}
          </div>
          <div className="item">
            <label htmlFor="forward-payments">
              Отложенные платежи: {forwardPayments.endAmount} руб.
            </label>
            {forwardPayments.endAmount > 0 && (
              <input
                type="number"
                name="forward-payments"
                min="0"
                max={forwardPayments.endAmount}
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
