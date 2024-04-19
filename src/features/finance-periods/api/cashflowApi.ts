import type { CashFlowItem } from "../types"

export async function uploadFixedPayment(
  payment: CashFlowItem,
): Promise<CashFlowItem> {
  return new Promise(resolve => resolve(payment))
}
