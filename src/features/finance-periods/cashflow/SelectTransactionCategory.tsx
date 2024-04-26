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
        <option value="fixed-payment">Обязательный</option>
        <option value="variable-payment">Остальное</option>
      </>
    )
  } else if (transactionType === "income") {
    select = (
      <>
        <option value="earning">Прибыль</option>
        <option value="add-stock">НЗ</option>
        <option value="add-forward-payment">Отложенные платежи</option>
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
        required
      >
        <option value={undefined}>-Выбрать-</option>
        {select}
      </select>
    </div>
  )
}

export default SelectTransactionCategory
