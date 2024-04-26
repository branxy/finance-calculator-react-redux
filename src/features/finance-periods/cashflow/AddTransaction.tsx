import { v4 as uuidv4 } from "uuid"
import { type FunctionComponent, useState } from "react"
import type { CashflowItem, FinancePeriod } from "../types"
import { getTodayDate } from "../../../utils"
import { useAppDispatch } from "../../../app/hooks"

import "./AddTransaction.css"
import { incomeAdded, paymentAdded } from "./cashflowSlice"
import SelectTransactionCategory from "./SelectTransactionCategory"

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
    console.log({ transaction })
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
    } else if (transaction.type === "earning" && newTransactionIsFilled) {
      submitIncome(transaction)
    } else
      throw new Error(
        `Unknown transaction.type: "${transaction.type}", at handleNewTransaction()`,
      )

    setNewTransaction({ ...sampleTransaction, type: transaction.type })
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
      type: "earning",
    } as CashflowItem
    dispatch(incomeAdded(newTransaction))
  }

  function addSavings(transaction: Omit<CashflowItem, "id">) {
    const newSavings: CashflowItem = {
      id: uuidv4(),
      ...transaction,
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
      <SelectTransactionCategory
        transactionType={transactionType}
        setNewTransaction={setNewTransaction}
      />
      <div className="title form-item">
        <label htmlFor="title">Название: </label>
        <input
          type="text"
          name="title"
          required
          size={16}
          value={newTransaction.title}
          onFocus={e => e.target.select()}
          onChange={handleNewPaymentChange}
        />
      </div>
      <div className="amount form-item">
        <label htmlFor="amount">Сумма: </label>
        <input
          type="number"
          name="amount"
          required
          min="1"
          value={newTransaction.amount || ""}
          onFocus={e => e.target.select()}
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
