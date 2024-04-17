import { type FunctionComponent } from "react"
import type { CashFlowItem } from "../types"

interface CashFlowListItemProps {
  id: CashFlowItem["id"]
  title: CashFlowItem["title"]
  amount: CashFlowItem["amount"]
  date: CashFlowItem["date"]
}

const CashFlowListItem: FunctionComponent<CashFlowListItemProps> = ({
  title,
  amount,
  date,
}) => {
  const shortenedDate = new Date(date).toLocaleDateString().slice(0, 5)
  return (
    <div className="cashflow-item">
      <span>
        {title + ": "}
        {amount + " руб., "}
        {shortenedDate}
      </span>
    </div>
  )
}

export default CashFlowListItem
