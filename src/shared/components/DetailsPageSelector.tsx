import { CSSProperties } from "react";
import { Selector, SelectorItem, SelectorProps } from "./Selector";

export type DetailsPageSelectorItem = {
  name: string;
  value: string;
};

interface DetailsPageSelectorProps extends SelectorProps {
  items: DetailsPageSelectorItem[];
}

export default function DetailsPageSelector({
  items,
  selected,
  onTabSelect,
  ...props
}: DetailsPageSelectorProps) {
  return (
    <div {...props}>
      <Selector
        selected={selected}
        onTabSelect={onTabSelect}
        className="text-center gap-[6px] border-none"
      >
        {items.map((item) => (
          <SelectorItem
            key={item.name}
            name={item.name}
            value={item.value}
            className="text-left font-bold px-2 py-1 border border-borderGray"
          />
        ))}
      </Selector>
    </div>
  );
}
