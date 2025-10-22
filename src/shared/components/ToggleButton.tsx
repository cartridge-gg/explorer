import { useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, cn } from "@cartridge/ui";

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
    [onChange],
  );

  return (
    <Tabs
      value={selected ?? variants[0]}
      onValueChange={handleTabSelect}
      className="h-min"
    >
      <TabsList
        className={cn(
          "h-auto p-0 select-none w-max bg-transparent",
          className,
        )}
      >
        {(variants as readonly string[]).map((type, index) => (
          <TabsTrigger
            key={type}
            value={type}
            className={cn(
              "data-[state=active]:shadow-none py-[2px] pr-[8px] pl-[10px] rounded-sm data-[state=active]:bg-background-200 data-[state=inactive]:bg-background-100 data-[state=inactive]:text-foreground-400 data-[state=active]:text-foreground-100 box-border border border-background-200 h-[20px] text-[11px]/[16px] font-medium uppercase tracking-[0.24px]",
              index === 0
                ? "data-[state=inactive]:rounded-r-none border-r-0"
                : index === variants.length - 1
                  ? "data-[state=inactive]:rounded-l-none border-l-0"
                  : "data-[state=inactive]:rounded-l-none data-[state=inactive]:rounded-r-none border-x-0",
            )}
          >
            {type}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
