import { type FunctionComponent } from "react"
import { type AddTransactionProps } from "./AddTransaction"
import type { CashflowItem } from "../types"

import "./AddTransaction.css"
import { Box, Select } from "@radix-ui/themes"

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
        <Select.Item value="payment/fixed">Обязательный</Select.Item>
        <Select.Item value="payment/variable">Остальное</Select.Item>
        {/* <option value="payment/fixed">Обязательный</option>
        <option value="payment/variable">Остальное</option> */}
      </>
    )
  } else if (transactionType === "income") {
    select = (
      <>
        <Select.Item value="income/profit">Прибыль</Select.Item>
        <Select.Item value="income/stock">НЗ</Select.Item>
        <Select.Item value="income/forward-payment">
          Отложенные платежи
        </Select.Item>
      </>
    )
  }

  return (
    <Box className="category form-item">
      <label htmlFor="category">Категория:</label>
      <Select.Root
        name="category"
        required={true}
        onValueChange={newValue =>
          setNewTransaction(prev => {
            const paymentType = newValue as CashflowItem["type"]
            return { ...prev, type: paymentType }
          })
        }
      >
        <Select.Trigger placeholder="Выбрать" style={{ width: "134px" }} />
        <Select.Content>{select}</Select.Content>
      </Select.Root>
      {/* 
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
      </select> */}
    </Box>
  )
}

export default SelectTransactionCategory
