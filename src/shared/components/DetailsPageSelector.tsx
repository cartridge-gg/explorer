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
  // dashed bottom border
  const styles: CSSProperties = {
    borderBottomStyle: "dashed",
    boxShadow: "0 2px 2px rgba(183, 183, 183, 0.25)",
  };

  return (
    <div
      style={styles}
      className="rounded-t-md overflow-clip px-[15px] pt-6 pb-3 border border-borderGray"
      {...props}
    >
      <Selector
        selected={selected}
        onTabSelect={onTabSelect}
        className="text-center rounded-sm"
      >
        {items.map((item) => (
          <SelectorItem
            key={item.name}
            name={item.name}
            value={item.value}
            className="px-2 py-1"
          />
        ))}
      </Selector>
    </div>
  );
}
