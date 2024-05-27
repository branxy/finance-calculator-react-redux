import { type FunctionComponent } from "react"
import { type AddTransactionProps } from "./AddTransaction"
import type { CashflowItem } from "../finance-periods/types"

import { Box, Select } from "@radix-ui/themes"
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
        <Select.Item value="payment/fixed">Обязательный</Select.Item>
        <Select.Item value="payment/variable">Остальное</Select.Item>
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
    </Box>
  )
}

export default SelectTransactionCategory
