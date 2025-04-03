/**
 * Dropdown Component Set
 *
 * This module provides a dropdown selection component system with the following parts:
 *
 * 1. DropdownContext - Shares state between parent and child components
 * 2. Dropdown - Dropdown component that manages selection state and toggle behavior
 * 3. DropdownItem - Individual dropdown items that can be selected
 *
 * These components work together through React's Context API to create
 * a cohesive dropdown selection interface without prop drilling.
 */

import * as icons from "lucide-react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface DropdownContextType {
  selected?: string;
  setSelected: (item: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedStyled?: React.CSSProperties;
}

/**
 * Context that allows DropdownItem components to access and modify
 * the currently selected item state from their parent Container
 */
const DropdownContext = createContext<DropdownContextType | undefined>(
  undefined
);

export interface DropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: string; // Initial selected item
  onItemSelect?: (item: string) => void; // Callback when selection changes
  selectedStyled?: React.CSSProperties; // Style to apply to selected items
  placeholder?: string; // Text to display when no item is selected
}

/**
 * The container component that manages dropdown selection state
 *
 * Wraps Item components and provides them with selection context
 * through DropdownContext.Provider
 */
export function Dropdown({
  selected: initialSelectedItem,
  onItemSelect: onSelect,
  selectedStyled,
  placeholder = "Select an option",
  children,
  className,
  ...props
}: DropdownProps) {
  const [selected, setSelected] = useState<string | undefined>(
    initialSelectedItem
  );
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Notify parent component of initial selection
  useEffect(() => {
    if (initialSelectedItem && onSelect) {
      onSelect(initialSelectedItem);
    }
  }, [initialSelectedItem]);

  // Handle item selection and propagate changes to parent component
  const handleItemSelect = useCallback(
    (item: string) => {
      setSelected(item);
      setIsOpen(false);
      if (onSelect) {
        onSelect(item);
      }
    },
    [onSelect]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const dropdownElement = document.getElementById("dropdown-container");
      if (dropdownElement && !dropdownElement.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Adjust dropdown options width to match container if needed
  useEffect(() => {
    if (isOpen && containerRef.current && optionsRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const optionsWidth = optionsRef.current.offsetWidth;

      if (containerWidth > optionsWidth) {
        optionsRef.current.style.width = `${containerWidth}px`;
      }
    }
  }, [isOpen]);

  return (
    <DropdownContext.Provider
      value={{
        selected,
        setSelected: handleItemSelect,
        isOpen,
        setIsOpen,
        selectedStyled,
      }}
    >
      <div
        id="dropdown-container"
        ref={containerRef}
        className={`h-[18px] relative uppercase text-xs select-none ${
          className || ""
        }`}
        {...props}
      >
        <div
          id="dropdown-selected"
          className="font-bold h-full w-full border border-borderGray bg-white px-[10px] cursor-pointer flex justify-between items-center gap-3"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{selected || placeholder}</span>
          <span>
            {isOpen ? (
              <icons.ChevronUp strokeWidth={2.3} width={12} />
            ) : (
              <icons.ChevronDown strokeWidth={2.3} width={12} />
            )}
          </span>
        </div>

        {isOpen && (
          <div
            id="dropdown-options"
            ref={optionsRef}
            className="w-max flex flex-col absolute top-[120%] left-0 border border-borderGray bg-white z-10 shadow-md"
          >
            {React.Children.toArray(children).filter((child) => {
              if (React.isValidElement(child) && selected !== undefined) {
                return child.props.value !== selected;
              }
              return true;
            })}
          </div>
        )}
      </div>
    </DropdownContext.Provider>
  );
}

export interface DropdownItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  name: string; // Display name
  value: string; // The actual value
}

const defaultDropdownSelectedStyle: React.CSSProperties = {
  backgroundColor: "#F0F0F0",
  fontWeight: "bold",
};

/**
 * Individual dropdown item component that can be selected
 *
 * Must be used as a child of Dropdown to function properly
 * as it relies on DropdownContext to access selection state
 */
export function DropdownItem({
  name,
  value,
  className,
  ...props
}: DropdownItemProps) {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("DropdownItem must be used within a Dropdown");
  }

  const { selected, setSelected, selectedStyled } = context;
  const isSelected = selected === value;

  const onClick = useCallback(() => {
    setSelected(value);
  }, [value, setSelected]);

  const computedSelectedStyle = useMemo<React.CSSProperties>(
    () => selectedStyled || defaultDropdownSelectedStyle,
    [selectedStyled]
  );

  return (
    <div
      onClick={onClick}
      style={isSelected ? computedSelectedStyle : undefined}
      className={`px-2 py-1 cursor-pointer hover:bg-gray-100 ${
        className || ""
      }`}
      {...props}
    >
      {name}
    </div>
  );
}
