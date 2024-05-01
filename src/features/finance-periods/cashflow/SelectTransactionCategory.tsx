import { type FunctionComponent } from "react"
import { type AddTransactionProps } from "./AddTransaction"
import type { CashflowItem } from "../types"

import "./AddTransaction.css"

interface SelectTransactionCategoryProps {
  transactionType: AddTransactionProps["transactionType"]
  setNewTransaction: React.Dispatch<
    React.SetStateAction<Omit<CashflowItem, "id">>
  >
}

const SelectTransactionCategory: FunctionComponent<
  SelectTransactionCategoryProps
> = ({ transactionType, setNewTransaction }) => {
  let select

  if (transactionType === "outcome") {
    select = (
      <>
        <option value="payment/fixed">Обязательный</option>
        <option value="payment/variable">Остальное</option>
      </>
    )
  } else if (transactionType === "income") {
    select = (
      <>
        <option value="income/profit">Прибыль</option>
        <option value="income/stock">НЗ</option>
        <option value="income/forward-payment">Отложенные платежи</option>
      </>
    )
  }

  return (
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
        required={true}
      >
        <option value={undefined}>-Выбрать-</option>
        {select}
      </select>
    </div>
  )
}

export default SelectTransactionCategory
