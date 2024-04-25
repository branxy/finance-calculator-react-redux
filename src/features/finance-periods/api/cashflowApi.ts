import type { CashflowItem } from "../types"

export async function uploadTransaction(
  payment: CashflowItem,
): Promise<CashflowItem> {
  return new Promise(resolve => resolve(payment))
}

interface UpdateTransactionPropsAndReturn {
  itemId: CashflowItem["id"]
  newValueType: "title" | "amount" | "date"
  newValue: string | number
}

export async function updateTransaction(
  props: UpdateTransactionPropsAndReturn,
): Promise<UpdateTransactionPropsAndReturn> {
  const returnValue = props
  return new Promise(resolve => resolve(returnValue))
}
