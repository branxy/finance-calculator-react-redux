import type { CashflowItem } from "../types"

export async function uploadPayment(
  payment: CashflowItem,
): Promise<CashflowItem> {
  return new Promise(resolve => resolve(payment))
}
