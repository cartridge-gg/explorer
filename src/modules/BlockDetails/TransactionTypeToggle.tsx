import { Selector, SelectorItem } from "@/shared/components/Selector";

const TxTypesTabs = ["All", "Invoke", "Deploy Account", "Declare"] as const;

interface TxTypeToggleProps {
  onFilterChange: (value: string) => void;
}

export default function TxTypeToggle({ onFilterChange }: TxTypeToggleProps) {
  return (
    <Selector
      selected={TxTypesTabs[0]}
      onTabSelect={onFilterChange}
      className="w-min"
    >
      {TxTypesTabs.map((type) => (
        <SelectorItem
          name={type}
          value={type}
          className="border-l border-l-borderGray w-max text-xs py-[2px]"
        />
      ))}
    </Selector>
  );
}
