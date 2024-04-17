import { useState, type FunctionComponent } from "react"
import type { CashFlow, FinancePeriod } from "../types"
import { useAppDispatch } from "../../../app/hooks"

interface ForecastProps {
  periodId: FinancePeriod["id"]
  startBalance: FinancePeriod["balance"]["startBalance"]
  endBalance: FinancePeriod["balance"]["endBalance"]
  earnings: CashFlow["earnings"]
  savings: FinancePeriod["savings"]
  fixedPayments: number
  variablePayments: number
  shortage: FinancePeriod["shortage"]
  compensation: FinancePeriod["compensation"]
}

const Forecast: FunctionComponent<ForecastProps> = ({
  periodId,
  startBalance,
  endBalance,
  earnings,
  savings,
  fixedPayments,
  variablePayments,
  shortage,
  compensation,
}) => {
  const [sumToCompensateStock, setSumToCompensateStock] = useState(0)
  const [sumToCompensateForwardPayments, setSumToCompensateForwardPayments] =
    useState(0)
  const dispatch = useAppDispatch()

  const totalIncome = earnings.reduce((sum, x) => sum + x.amount, 0)
  const endStockAmount = savings.stock.endAmount
  const endFPAmount = savings.forwardPayments.endAmount
  const compensations = `${
    compensation.stock > 0 ? ` + ${compensation.stock}(НЗ)` : ""
  }${
    compensation.forwardPayments > 0
      ? ` + ${compensation.forwardPayments}(ОП)`
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
        Баланс после трат: {startBalance}
        <span>
          {" "}
          + <span className="income">{totalIncome ? totalIncome : "0"}</span>
        </span>{" "}
        - (<span className="payments">{fixedPayments + variablePayments}</span>)
        {compensations} = {endBalance} руб.
      </span>
      <span className="shortage">Недостаток: {Math.abs(shortage)} руб.</span>
      <div className="compensation" id="compensation">
        <span>Способ возмещения:</span>
        <form onSubmit={handleSubmitCompensation}>
          <div className="item">
            <label htmlFor="stock">НЗ: {endStockAmount} руб.</label>
            {endStockAmount > 0 && (
              <input
                type="number"
                name="stock"
                value={sumToCompensateStock}
                min="0"
                max={endStockAmount}
                onChange={handleSelectCompensation}
              />
            )}
          </div>
          <div className="item">
            <label htmlFor="forward-payments">
              Отложенные платежи: {endFPAmount} руб.
            </label>
            {endFPAmount > 0 && (
              <input
                type="number"
                name="forward-payments"
                min="0"
                max={endFPAmount}
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
