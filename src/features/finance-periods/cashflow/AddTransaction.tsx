import { v4 as uuidv4 } from "uuid"
import { type FunctionComponent, useState } from "react"
import type { CashflowItem, FinancePeriod } from "../types"
import { getTodayDate } from "../../../utils"
import { useAppDispatch } from "../../../app/hooks"

import "./AddTransaction.css"
import { addedPayment } from "./cashflowSlice"

interface AddTransactionProps {
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
  const today = getTodayDate()

  const dispatch = useAppDispatch()

  const sampleTransaction: Omit<CashflowItem, "id"> = {
    period_id: periodId,
    type: undefined,
    title: "",
    amount: 0,
    date: today,
  }

  const [newTransaction, setNewTransaction] =
    useState<Omit<CashflowItem, "id">>(sampleTransaction)

  function handleNewTransaction(transaction: Omit<CashflowItem, "id">) {
    // 1. Determines transactionType
    // 2. If it's payment, submitPayment()
    // 3. If it's income, submitIncome()
    const newTransactionIsFilled =
      newTransaction.title.length > 0 && newTransaction.amount > 0
    const isPayment =
      transaction.type === "fixed-payment" ||
      transaction.type === "variable-payment"
    if (isPayment && newTransactionIsFilled) {
      submitPayment(transaction)
    } else if (transaction.type === "earning") {
      submitIncome(transaction)
    }

    setNewTransaction({ ...sampleTransaction, type: transaction.type })
  }

  function submitPayment(payment: Omit<CashflowItem, "id">) {
    if (typeof end_balance === "number") {
      const paymentToUpload: CashflowItem = {
        id: uuidv4(),
        ...payment,
      }
      dispatch(addedPayment(paymentToUpload))
    }
  }

  function submitIncome(transaction: Omit<CashflowItem, "id">) {
    const newEndBalance = end_balance && end_balance + transaction.amount

    if (typeof newEndBalance === "number") {
      const newTransaction = { id: uuidv4(), ...transaction }
      dispatch({
        type: "addIncome",
        periodId,
        newTransaction,
      })
    }
  }

  function handleNewPaymentChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNewTransaction(prev => {
      const value = e.target.value
      const inputName = e.target.name as "title" | "amount" | "date"
      switch (inputName) {
        case "title":
          return { ...prev, title: value }
          break
        case "amount":
          return { ...prev, amount: Number(value) }
          break
        case "date":
          return { ...prev, date: value }
          break
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
      {transactionType === "outcome" && (
        <div className="category form-item">
          <label htmlFor="category">Категория:</label>
          <select
            name="category"
            onChange={e =>
              setNewTransaction(prev => {
                const paymentType = e.target.value as CashflowItem["type"]
                return { ...prev, type: paymentType }
              })
            }
            required
          >
            <option value={undefined}>-Выбрать-</option>
            <option value="fixed-payment">Обязательный</option>
            <option value="variable-payment">Остальное</option>
          </select>
        </div>
      )}
      <div className="title form-item">
        <label htmlFor="title">Название: </label>
        <input
          type="text"
          name="title"
          value={newTransaction.title}
          required
          size={18}
          onChange={handleNewPaymentChange}
        />
      </div>
      <div className="amount form-item">
        <label htmlFor="amount">Сумма: </label>
        <input
          type="number"
          name="amount"
          value={newTransaction.amount}
          required
          min="1"
          onChange={handleNewPaymentChange}
        />
      </div>
      <div className="date form-item">
        <label htmlFor="date">Дата: </label>
        <input
          type="date"
          name="date"
          value={newTransaction.date}
          required={true}
          onChange={handleNewPaymentChange}
        />
      </div>
      <div className="actions form-item">
        <button onClick={() => handleNewTransaction(newTransaction)}>
          <span className="material-symbols-outlined">add</span>
          <span>
            Добавить {transactionType === "outcome" ? "платеж" : "доход"}
          </span>
        </button>
      </div>
    </form>
  )
}

export default AddTransaction
