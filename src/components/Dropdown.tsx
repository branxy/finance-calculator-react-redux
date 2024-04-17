import { type FunctionComponent, type ReactNode, useState } from "react"

interface DropdownProps {
  children: ReactNode
  title: string
  isOpenByDefault: boolean
}

const Dropdown: FunctionComponent<DropdownProps> = ({
  children,
  title,
  isOpenByDefault,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(isOpenByDefault)
  return (
    <div className={`dropdown ${isDropdownOpen ? "open" : "closed"}`}>
      <div className="header">
        <h3>{title}</h3>
        <button
          className="toggle"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {isDropdownOpen ? (
            <span className="material-symbols-outlined">expand_more</span>
          ) : (
            <span className="material-symbols-outlined">chevron_right</span>
          )}
        </button>
      </div>
      <div className="content">{isDropdownOpen && children}</div>
    </div>
  )
}

export default Dropdown
