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
  const selectedStyle = {
    color: "white",
    border: "none",
    boxShadow: "none",
    backgroundColor: "#262626",
  };

  return (
    <div {...props}>
      <Selector
        selected={selected}
        onTabSelect={onTabSelect}
        selectedStyled={selectedStyle}
        className="text-center gap-[6px] border-none"
      >
        {items.map((item) => (
          <SelectorItem
            key={item.name}
            name={item.name}
            value={item.value}
            className="flex justify-start font-bold px-[15px] py-1 border border-borderGray hover:bg-button-whiteInitialHover"
          />
        ))}
      </Selector>
    </div>
  );
}
