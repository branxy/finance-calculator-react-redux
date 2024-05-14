import { type FunctionComponent, type ReactNode, useState } from "react"
import "./Dropdown.css"
import { Button, Flex, Heading } from "@radix-ui/themes"

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
      <Flex justify="between" align="center" width="100%" className="title">
        <Heading
          as="h3"
          size="5"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {title}
        </Heading>
        <Button
          variant="ghost"
          mr="1"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {isDropdownOpen ? (
            <span className="material-symbols-outlined">expand_more</span>
          ) : (
            <span className="material-symbols-outlined">chevron_right</span>
          )}
        </Button>
      </Flex>
      <Flex mt="4">{isDropdownOpen && children}</Flex>
    </div>
  )
}

export default Dropdown
