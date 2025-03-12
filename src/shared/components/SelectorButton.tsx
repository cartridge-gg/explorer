import React, {
  useCallback,
  useState,
  createContext,
  useContext,
  useEffect,
} from "react";

/**
 * Selector Component Set
 *
 * This module provides a tab/selector component system with the following parts:
 *
 * 1. SelectorContext - Shares state between parent and child components
 * 2. Selector - Container component that manages selection state
 * 3. SelectorItem - Individual tab items that can be selected
 *
 * These components work together through React's Context API to create
 * a cohesive tab selection interface without prop drilling.
 */

interface SelectorContextType {
  selected: string;
  setSelected: (tab: string) => void;
}

/**
 * Context that allows SelectorItem components to access and modify
 * the currently selected tab state from their parent SelectorHeader
 */
const SelectorContext = createContext<SelectorContextType | undefined>(
  undefined
);

interface SelectorHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: string; // Initial selected tab
  onTabSelect?: (tab: string) => void; // Callback when selection changes
  children: React.ReactNode; // Tab items (SelectorItem components)
}

/**
 * Container component that manages tab selection state
 *
 * Wraps SelectorItem components and provides them with selection context
 * through SelectorContext.Provider
 */
export default function Selector({
  selected: initialSelectedTab = "",
  onTabSelect: onSelect,
  children,
  className,
  ...props
}: SelectorHeaderProps) {
  const [selected, setSelected] = useState(initialSelectedTab);

  // Notify parent component of initial selection
  useEffect(() => {
    if (initialSelectedTab && onSelect) {
      onSelect(initialSelectedTab);
    }
  }, [initialSelectedTab, onSelect]);

  // Handle tab selection and propagate changes to parent component
  const handleTabSelect = useCallback(
    (tab: string) => {
      setSelected(tab);
      if (onSelect) {
        onSelect(tab);
      }
    },
    [onSelect]
  );

  return (
    <SelectorContext.Provider
      value={{ selected: selected, setSelected: handleTabSelect }}
    >
      <div
        className={`border border-borderGray flex border-collapse overflow-clip ${
          className || ""
        }`}
        {...props}
      >
        {children}
      </div>
    </SelectorContext.Provider>
  );
}

/**
 * Props for the SelectorItem component
 */
interface SelectorItemProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string; // Display name
  value: string; // The actual value
}

/**
 * Individual tab component that can be selected
 *
 * Must be used as a child of SelectorHeader to function properly
 * as it relies on SelectorContext to access selection state
 */
export function SelectorItem({
  name,
  value,
  className,
  ...props
}: SelectorItemProps) {
  const context = useContext(SelectorContext);
  if (!context) {
    throw new Error("SelectorItem must be used within a Selector");
  }

  const { selected, setSelected } = context;
  const isSelected = selected === value;

  const onClick = useCallback(() => {
    setSelected(value);
  }, [value, setSelected]);

  const itemStyle = React.useMemo<React.CSSProperties>(
    () => ({
      color: isSelected ? "#ffff" : "#000000",
      backgroundColor: isSelected ? "#D0D0D0" : "#ffff",
      boxShadow: isSelected ? "inset 0px 1px 3px rgba(0, 0, 0, 0.25)" : "none",
    }),
    [isSelected]
  );

  return (
    <div
      onClick={onClick}
      style={itemStyle}
      // `margin-right: -1px;` to simulate `border-collapse`
      className={` ${
        className || ""
      } mr-[-1px] w-full px-2  uppercase font-bold transition-colors ease-in duration-75 cursor-pointer`}
      {...props}
    >
      {name}
    </div>
  );
}
