import { useCallback } from "react";
import { Selector, SelectorItem } from "./Selector";

type ToggleVariants = readonly string[];

type ToggleButtonProps<T extends ToggleVariants> = {
  variants: T;
  selected?: T[number];
  onChange?: (value: T[number]) => void;
  className?: string;
};

export default function ToggleButton<T extends ToggleVariants>({
  onChange,
  selected,
  className,
  variants,
}: ToggleButtonProps<T>) {
  const handleTabSelect = useCallback(
    (value: string) => {
      if (onChange) onChange(value as T[number]);
    },
    [onChange]
  );

  return (
    <Selector
      selected={selected}
      onTabSelect={handleTabSelect}
      className={`w-min bg-white h-[15px] ${className || ""}`}
    >
      {(variants as readonly string[]).map((type) => (
        <SelectorItem
          key={type}
          name={type}
          value={type}
          className="w-max text-xs flex items-center justify-center font-bold text-[#B0B0B0]"
        />
      ))}
    </Selector>
  );
}
