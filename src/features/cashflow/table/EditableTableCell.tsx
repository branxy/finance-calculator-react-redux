import { useState, type FunctionComponent } from "react"
import type { CashflowItem } from "../../finance-periods/types"
import "./CashflowTable.css"
import { cashflowItemChanged } from "../cashflowSlice"
import "./CashflowTable.css"
import { useAppDispatch } from "../../../app/hooks"

interface EditableTableCellProps {
  cashflowItemId: CashflowItem["id"]
  cellType: "title" | "amount" | "date"
  cellValue: string | number
}

const inputType = {
  title: "text",
  amount: "number",
  date: "text",
}

const EditableTableCell: FunctionComponent<EditableTableCellProps> = ({
  cashflowItemId,
  cellType,
  cellValue,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [inputValue, setInputValue] = useState(cellValue)
  const dispatch = useAppDispatch()

  function handleClickEdit() {
    setIsEditing(true)
  }

  function handleInputBlur() {
    const inputDoesntExceedLimits =
      (cellType === "amount" && Number(inputValue) <= 100000000000) ||
      cellType !== "amount"

    if (inputDoesntExceedLimits) {
      dispatch(
        cashflowItemChanged({
          cashflowItemId,
          whatChanged: cellType,
          newValue: cellType === "amount" ? Number(inputValue) : inputValue,
        }),
      )

      setIsEditing(false)
      setIsHovered(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && Boolean(inputValue)) {
      handleInputBlur()
    }
  }

  if (isEditing) {
    return (
      <td className="editable">
        <input
          type={inputType[cellType]}
          id="table-cell-input"
          name="table-cell-input"
          value={inputValue}
          max="1000000000"
          autoFocus={isEditing}
          onFocus={e => e.target.select()}
          onChange={e => setInputValue(e.target.value)}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
        />
      </td>
    )
  } else {
    return (
      <td
        className="editable"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="title-edit">
          <span>
            {inputValue}
            {cellType === "amount" && " $"}
          </span>
          {isHovered && (
            <button className="action" onClick={handleClickEdit}>
              <span className="material-symbols-outlined">edit</span>
            </button>
          )}
        </div>
      </td>
    )
  }
}

export default EditableTableCell
