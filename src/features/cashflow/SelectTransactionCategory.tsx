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
        <Select.Item value="payment/fixed">Fixed</Select.Item>
        <Select.Item value="payment/variable">Miscellaneous</Select.Item>
      </>
    )
  } else if (transactionType === "income") {
    select = (
      <>
        <Select.Item value="income/profit">Income</Select.Item>
        <Select.Item value="income/stock">Savings</Select.Item>
        <Select.Item value="income/forward-payment">
          Forward payments
        </Select.Item>
      </>
    )
  }

  return (
    <Box className="category form-item">
      <label htmlFor="category">Category:</label>
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
        <Select.Trigger placeholder="Select" style={{ width: "134px" }} />
        <Select.Content>{select}</Select.Content>
      </Select.Root>
    </Box>
  )
}

export default SelectTransactionCategory
