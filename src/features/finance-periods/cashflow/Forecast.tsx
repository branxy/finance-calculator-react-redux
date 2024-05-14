import { useState, type FunctionComponent } from "react"
import type { CashflowItem, FinancePeriod } from "../types"
import { useAppDispatch, useAppSelector } from "../../../app/hooks"
import "./Forecast.css"
import {
  compensationSubmitted,
  selectSumOfStockAndFPCompensationsByPeriodId,
} from "./cashflowSlice"
import { Box, Button, Flex, TextField } from "@radix-ui/themes"

export type EarningsT = {
  id: CashflowItem["id"]
  period_id: CashflowItem["period_id"]
  type: "income/profit"
  title: CashflowItem["title"]
  amount: CashflowItem["amount"]
  date: CashflowItem["date"]
}[]

export type AllPayments = {
  id: CashflowItem["id"]
  period_id: CashflowItem["period_id"]
  type: "payment/fixed" | "payment/variable"
  title: CashflowItem["title"]
  amount: CashflowItem["amount"]
  date: CashflowItem["date"]
}[]

export type FixedPaymentsT = {
  id: CashflowItem["id"]
  period_id: CashflowItem["period_id"]
  type: "payment/fixed"
  title: CashflowItem["title"]
  amount: CashflowItem["amount"]
  date: CashflowItem["date"]
}[]

export type VariablePaymentsT = {
  id: CashflowItem["id"]
  period_id: CashflowItem["period_id"]
  type: "payment/variable"
  title: CashflowItem["title"]
  amount: CashflowItem["amount"]
  date: CashflowItem["date"]
}[]

interface ForecastProps {
  periodId: FinancePeriod["id"]
  user_id: FinancePeriod["user_id"]
  start_balance: FinancePeriod["start_balance"]
  end_balance: FinancePeriod["end_balance"]
  earnings: EarningsT
  stock: FinancePeriod["stock"]
  forwardPayments: FinancePeriod["forward_payments"]
  fixedPayments: number
  variablePayments: number
}

const Forecast: FunctionComponent<ForecastProps> = ({
  periodId,
  user_id,
  start_balance,
  end_balance,
  earnings,
  stock,
  forwardPayments,
  fixedPayments,
  variablePayments,
}) => {
  const dispatch = useAppDispatch()

  const [sumToCompensateStock, setSumToCompensateStock] = useState(0)
  const [sumToCompensateForwardPayments, setSumToCompensateForwardPayments] =
    useState(0)
  const [submittedStockCompensation, setSubmittedStockCompensation] =
    useState(0)
  const [submittedFPCompensation, setSubmittedFPCompensation] = useState(0)
  const [sumOfStockCompensations, sumOfFPCompensations] = useAppSelector(
    state => selectSumOfStockAndFPCompensationsByPeriodId(state, periodId),
  )
  const compensationSum = sumToCompensateStock + sumToCompensateForwardPayments
  const shortage = end_balance < 0 ? Math.abs(end_balance) : 0
  const compensationError =
    (shortage === 0 && compensationSum > 0) || compensationSum > shortage

  const totalIncome = earnings.reduce((sum, x) => sum + x.amount, 0)

  const compensations = `${sumOfStockCompensations > 0 ? ` + ${sumOfStockCompensations} (НЗ)` : ""}${sumOfFPCompensations > 0 ? ` + ${sumOfFPCompensations} (ОП)` : ""}`

  const error = compensationError && (
    <span className="error">Сумма компенсации превышает сумму недостатка</span>
  )
  const classError = `${compensationError && "error"}`

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

  function handleSubmitCompensation() {
    if (!compensationError) {
      dispatch(
        compensationSubmitted({
          periodId,
          userId: user_id,
          compensationAmount: {
            stock: sumToCompensateStock,
            fp: sumToCompensateForwardPayments,
          },
        }),
      )
      setSubmittedStockCompensation(prev => prev + sumToCompensateStock)
      setSubmittedFPCompensation(prev => prev + sumToCompensateForwardPayments)
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
        <span>Резервы:</span>
        <form
          onSubmit={e => {
            e.preventDefault()
            handleSubmitCompensation()
          }}
        >
          <Flex className="item">
            <label htmlFor="stock">НЗ: {stock} руб.</label>
            {stock > 0 && (
              <Box flexGrow="1" maxWidth="120px">
                <TextField.Root
                  type="number"
                  name="stock"
                  value={sumToCompensateStock}
                  color={compensationError ? "red" : "green"}
                  min="0"
                  max={stock}
                  onFocus={e => e.target.select()}
                  onChange={handleSelectCompensation}
                />
              </Box>
            )}
          </Flex>
          <Flex gap="2">
            <label htmlFor="forward-payments">
              Отложенные платежи: {forwardPayments} руб.
            </label>
            {forwardPayments > 0 && (
              <Box flexGrow="1" maxWidth="120px">
                <TextField.Root
                  type="number"
                  name="forward-payments"
                  id="forward-payments"
                  min="0"
                  max={forwardPayments}
                  value={sumToCompensateForwardPayments}
                  onFocus={e => e.target.select()}
                  onChange={handleSelectCompensation}
                />
              </Box>
            )}
          </Flex>
          <p>{error}</p>
          <Button
            type="submit"
            variant="outline"
            onClick={handleSubmitCompensation}
            disabled={!(compensationSum > 0) || compensationError}
          >
            Внести компенсацию
          </Button>
        </form>
      </div>
    </div>
  )
}

export default Forecast
