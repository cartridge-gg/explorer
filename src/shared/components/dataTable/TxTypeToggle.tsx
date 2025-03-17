import { Selector, SelectorItem } from "@/shared/components/Selector";

const TxTypesTabs = ["All", "Invoke", "Deploy Account", "Declare"] as const;

interface TxTypeToggleProps {
  onFilterChange: (value: string) => void;
}

export function TxTypeToggle({ onFilterChange }: TxTypeToggleProps) {
  return (
    <Selector
      selected={TxTypesTabs[0]}
      onTabSelect={onFilterChange}
      className="w-min rounded-sm"
    >
      {TxTypesTabs.map((type) => (
        <SelectorItem
          key={type}
          name={type}
          value={type}
          className="w-max text-xs py-[2px]"
        />
      ))}
    </Selector>
  );
}
