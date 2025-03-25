import { useCallback } from "react";
import { Selector, SelectorItem } from "./Selector";

export const FeltDisplayVariants = ["decimal", "hex"] as const;

type FeltDisplayToggleProps = {
  displayAs?: (typeof FeltDisplayVariants)[number];
  onChange?: (value: (typeof FeltDisplayVariants)[number]) => void;
};

export default function FeltDisplayAsToggle({
  onChange,
  displayAs = "hex",
}: FeltDisplayToggleProps) {
  const handleTabSelect = useCallback(
    (value: string) => {
      if (onChange) onChange(value as (typeof FeltDisplayVariants)[number]);
    },
    [onChange]
  );

  return (
    <Selector
      selected={displayAs}
      onTabSelect={handleTabSelect}
      className="w-min rounded-sm bg-white z-10"
    >
      {FeltDisplayVariants.map((type) => (
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
