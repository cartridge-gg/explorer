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
 * 2. SelectorHeader - Container component that manages selection state
 * 3. SelectItem - Individual tab items that can be selected
 *
 * These components work together through React's Context API to create
 * a cohesive tab selection interface without prop drilling.
 */

interface SelectorContextType {
  selected: string;
  setSelected: (tab: string) => void;
}

/**
 * Context that allows SelectItem components to access and modify
 * the currently selected tab state from their parent SelectorHeader
 */
const SelectorContext = createContext<SelectorContextType | undefined>(
  undefined
);

interface SelectorHeaderProps {
  selected?: string; // Initial selected tab
  onTabSelect?: (tab: string) => void; // Callback when selection changes
  children: React.ReactNode; // Tab items (SelectItem components)
}

/**
 * Container component that manages tab selection state
 *
 * Wraps SelectItem components and provides them with selection context
 * through SelectorContext.Provider
 */
export default function SelectorHeader({
  selected: initialSelectedTab = "",
  onTabSelect: onSelect,
  children,
}: SelectorHeaderProps) {
  const [selected, setSelected] = useState(initialSelectedTab);

  // Notify parent component of initial selection
  useEffect(() => {
    if (initialSelectedTab && onSelect) {
      onSelect(initialSelectedTab);
    }
  }, []);

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

  const styles: React.CSSProperties = {
    borderBottomStyle: "dashed",
    boxShadow: "0 2px 2px rgba(183, 183, 183, 0.25)",
  };

  return (
    <SelectorContext.Provider
      value={{ selected: selected, setSelected: handleTabSelect }}
    >
      <div
        style={styles}
        className="rounded-t-md flex-grow px-[15px] pt-6 pb-3 border border-borderGray h-min"
      >
        <div className="flex flex-col sm:flex-row text-center">{children}</div>
      </div>
    </SelectorContext.Provider>
  );
}

/**
 * Props for the SelectItem component
 */
interface SelectItemProps {
  name: string; // Display name and unique identifier for this tab
}

/**
 * Individual tab component that can be selected
 *
 * Must be used as a child of SelectorHeader to function properly
 * as it relies on SelectorContext to access selection state
 */
export function SelectItem({ name }: SelectItemProps) {
  const context = useContext(SelectorContext);
  if (!context) {
    throw new Error("SelectItem must be used within a SelectorHeader");
  }

  const { selected, setSelected } = context;
  const isSelected = selected === name;

  const onClick = useCallback(() => {
    setSelected(name);
  }, [name, setSelected]);

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
      className="w-full px-2 py-[3px] border border-borderGray uppercase font-bold"
    >
      {name}
    </div>
  );
}
