import { v4 as uuidv4 } from "uuid"
import { type FunctionComponent, useState } from "react"
import type { CashFlowItem, FinancePeriod } from "../types"
import { getTodayDate } from "../../../utils"
import { useAppDispatch } from "../../../app/hooks"

import "./AddTransaction.css"

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
  const sampleTransaction: CashFlowItem = {
    id: uuidv4(),
    period_id: periodId,
    title: "",
    amount: 0,
    date: today,
  }
  const dispatch = useAppDispatch()
  const [newTransaction, setNewTransaction] =
    useState<CashFlowItem>(sampleTransaction)
  const [paymentType, setPaymentType] = useState("")

  function handleNewTransaction(
    transaction: CashFlowItem,
    paymentType: string,
  ) {
    // 1. Determines transactionType
    // 2. If it's payment, submitPayment()
    // 3. If it's income, submitIncome()
    const newTransactionIsFilled =
      newTransaction.title.length > 0 && newTransaction.amount
    if (
      transactionType === "outcome" &&
      paymentType &&
      newTransactionIsFilled
    ) {
      submitPayment(transaction, paymentType)
    } else if (transactionType === "income") {
      submitIncome(transaction)
    }

    setNewTransaction({ ...sampleTransaction, id: uuidv4() })
  }

  function submitPayment(payment: CashFlowItem, paymentType: string) {
    if (typeof end_balance === "number") {
      switch (paymentType) {
        case "fixed":
          // fix
          dispatch({
            type: "addFixedPayment",
            periodId,
            newTransaction: payment,
          })
          break
        case "variable":
          // fix
          dispatch({
            type: "addVariablePayment",
            periodId,
            newTransaction: payment,
          })
          break
        default:
          throw new Error(`Unknown type of payment: ${paymentType}`)
      }
    }
  }

  function submitIncome(transaction: CashFlowItem) {
    const newEndBalance = end_balance && end_balance + transaction.amount

    if (typeof newEndBalance === "number") {
      dispatch({
        type: "addIncome",
        periodId,
        newTransaction: transaction,
      })
    }
  }

  function handleNewPaymentChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNewTransaction(prev => {
      const value = e.target.value
      switch (e.target.name) {
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
        handleNewTransaction(newTransaction, paymentType)
      }}
    >
      {transactionType === "outcome" && (
        <div className="category form-item">
          <label htmlFor="category">Категория:</label>
          <select
            name="category"
            onChange={e => setPaymentType(e.target.value)}
            required
          >
            <option value="">-Выбрать-</option>
            <option value="fixed">Обязательный</option>
            <option value="variable">Остальное</option>
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
        <button
          onClick={() => handleNewTransaction(newTransaction, paymentType)}
        >
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
