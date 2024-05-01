import { useState, type FunctionComponent } from "react"
import type { CashflowItem } from "../../types"
import { useAppDispatch } from "../../../../app/hooks"
import "./CashflowTable.css"
import { cashflowItemChanged } from "../cashflowSlice"
import "./CashflowTable.css"

interface EditableTableCellProps {
  cashflowItemId: CashflowItem["id"]
  cellType: "title" | "amount" | "date"
  cellValue: string | number
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
    setIsEditing(false)
    setIsHovered(false)

    dispatch(
      cashflowItemChanged({
        cashflowItemId,
        whatChanged: cellType,
        newValue: cellType === "amount" ? Number(inputValue) : inputValue,
      }),
    )
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
          type="text"
          value={inputValue}
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
            {cellType === "amount" && " руб."}
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
