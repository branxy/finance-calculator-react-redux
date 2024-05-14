import { v4 as uuidv4 } from "uuid"
import { type FunctionComponent, useState, useContext } from "react"
import type { CashflowItem, FinancePeriod } from "../types"
import { useAppDispatch } from "../../../app/hooks"

import "./AddTransaction.css"
import { incomeAdded, paymentAdded } from "./cashflowSlice"
import SelectTransactionCategory from "./SelectTransactionCategory"
import { Button, TextField } from "@radix-ui/themes"
import { PeriodContext } from "../period/Period"

export interface AddTransactionProps {
  periodId: FinancePeriod["id"]
  transactionType: "income" | "outcome"
  fixedPaymentsLength?: number
  variablePaymentsLength?: number
  end_balance: FinancePeriod["end_balance"]
}

const AddTransaction: FunctionComponent<AddTransactionProps> = ({
  periodId,
  transactionType,
  end_balance,
}) => {
  const { start_date: periodStartDate } = useContext(PeriodContext)!
  const dispatch = useAppDispatch()

  const sampleTransaction: Omit<CashflowItem, "id"> = {
    period_id: periodId,
    user_id: "1-user-id",
    type: undefined,
    title: "",
    amount: 0,
    date: "",
  }

  const [newTransaction, setNewTransaction] =
    useState<Omit<CashflowItem, "id">>(sampleTransaction)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const errorMessage = <span className="error">{error}</span>

  function handleNewTransaction(transaction: Omit<CashflowItem, "id">) {
    // 1. Determines transactionType
    // 2. If it's payment, submitPayment()
    // 3. If it's income, submitIncome()
    setIsLoading(true)
    const newTransactionIsFilled =
      newTransaction.title.length > 0 &&
      newTransaction.amount > 0 &&
      transaction.type !== undefined
    const isPayment =
      transaction.type === "payment/fixed" ||
      transaction.type === "payment/variable"
    const isIncome =
      transaction.type === "income/profit" ||
      transaction.type === "income/stock" ||
      transaction.type === "income/forward-payment"
    if (!newTransactionIsFilled) {
      setError("Заполните все поля транзакции")
      setIsLoading(false)
      return
    }

    if (isPayment) {
      setError(null)
      submitPayment(transaction)
    } else if (isIncome) {
      setError(null)
      submitIncome(transaction)
    }

    setNewTransaction({ ...sampleTransaction, type: transaction.type })
    setIsLoading(false)
  }

  function submitPayment(payment: Omit<CashflowItem, "id">) {
    if (typeof end_balance === "number") {
      const paymentToUpload: CashflowItem = {
        id: uuidv4(),
        ...payment,
      }
      dispatch(paymentAdded(paymentToUpload))
    }
  }

  function submitIncome(transaction: Omit<CashflowItem, "id">) {
    const newTransaction = {
      ...transaction,
      id: uuidv4(),
    } as CashflowItem
    dispatch(incomeAdded(newTransaction))
  }

  function handleNewPaymentChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNewTransaction(prev => {
      const value = e.target.value
      const inputName = e.target.name as "title" | "amount" | "date"
      switch (inputName) {
        case "title":
          return { ...prev, title: value }
        case "amount":
          return { ...prev, amount: Number(value) }
        case "date":
          return { ...prev, date: value }
        default:
          throw new Error(`Unknown input: ${e.target}`)
      }
    })
  }

  return (
    <form
      className="add-transaction"
      onSubmit={e => {
        e.preventDefault()
        handleNewTransaction(newTransaction)
      }}
    >
      <SelectTransactionCategory
        transactionType={transactionType}
        setNewTransaction={setNewTransaction}
      />
      <div className="title form-item">
        <label htmlFor="transaction-title">Название: </label>
        <TextField.Root
          type="text"
          name="title"
          id="transaction-title"
          required
          value={newTransaction.title}
          onFocus={e => e.target.select()}
          onChange={handleNewPaymentChange}
        />
      </div>
      <div className="amount form-item">
        <label htmlFor="transaction-amount">Сумма: </label>
        <TextField.Root
          type="number"
          name="amount"
          id="transaction-amount"
          required
          min="1"
          value={newTransaction.amount || ""}
          onFocus={e => e.target.select()}
          onChange={handleNewPaymentChange}
        />
      </div>
      <div className="date form-item">
        <label htmlFor="transaction-date">Дата: </label>
        <input
          type="date"
          name="date"
          id="transaction-date"
          value={newTransaction.date || periodStartDate}
          required={true}
          onChange={handleNewPaymentChange}
        />
      </div>
      {error && errorMessage}
      <div className="actions form-item">
        <Button
          variant="surface"
          loading={isLoading}
          onClick={() => handleNewTransaction(newTransaction)}
        >
          <span className="material-symbols-outlined">add</span>
          <span>
            Добавить {transactionType === "outcome" ? "платеж" : "доход"}
          </span>
        </Button>
      </div>
    </form>
  )
}

export default AddTransaction
