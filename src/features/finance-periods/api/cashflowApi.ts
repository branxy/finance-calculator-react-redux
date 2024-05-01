import { getTodayDate } from "../../../utils"
import type { Cashflow, CashflowItem } from "../types"
import { v4 as uuidv4 } from "uuid"

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

export async function uploadCompensations(
  newCompensations: Cashflow,
): Promise<Cashflow> {
  return new Promise(resolve => resolve(newCompensations))
}

export function generateTestCashflow(
  numberOfItems = 3,
  titles: string[],
  amounts: number[],
): Cashflow {
  let arr: Cashflow = []
  const date = getTodayDate()

  for (let i = 0; i < numberOfItems; i++) {
    const title = titles[i]
    const amount = amounts[i]

    arr.push({
      id: uuidv4(),
      period_id: "1",
      type: "payment/fixed",
      title,
      amount,
      date,
    })
  }

  return arr
}
