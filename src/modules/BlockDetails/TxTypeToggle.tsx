import { Dropdown, DropdownItem } from "@/shared/components/Dropdown";
import { Selector, SelectorItem } from "@/shared/components/Selector";

const TxTypesTabs = ["All", "Invoke", "Deploy Account", "Declare"] as const;

interface TxTypeToggleProps {
  onFilterChange: (value: string) => void;
}

export default function TxTypeToggle({ onFilterChange }: TxTypeToggleProps) {
  return (
    <Dropdown
      selected={TxTypesTabs[0]}
      onItemSelect={onFilterChange}
      className="min-w-[60px] max-w-max"
    >
      {TxTypesTabs.map((type) => (
        <DropdownItem
          key={type}
          name={type}
          value={type}
          className="text-xs py-[2px]"
        />
      ))}
    </Dropdown>
  );
}
