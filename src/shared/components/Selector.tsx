import { cn, TabsList, TabsTrigger } from "@cartridge/ui";

export interface SelectorKV {
  value: string;
  label: string;
}

// Helper type to enforce minimum array length
type MinLength<T, N extends number> = T[] & { length: N } & T[];

export interface SelectorProps {
  containerClassName?: string;
  className?: string;
  items: MinLength<SelectorKV, 2>; // Minimum 2 items
}

/**
 *
 * @param item - Minimum 2 items
 */
export const Selector = ({
  containerClassName,
  className,
  items,
}: SelectorProps) => {
  if (items.length < 2) {
    throw new Error("Selector requires at least 2 items");
  }

  return (
    <TabsList className={cn("h-auto p-0 select-none", containerClassName)}>
      {items.map((item, i) => (
        <TabsTrigger
          key={i}
          value={item.value}
          className={cn(
            "data-[state=active]:shadow-none py-[2px] pr-[8px] pl-[10px] rounded-sm data-[state=active]:bg-background-200 data-[state=inactive]:bg-background-100 data-[state=inactive]:text-foreground-400 data-[state=active]:text-foreground-100 box-border border border-background-200 h-[20px]",
            i === 0
              ? "data-[state=inactive]:rounded-r-none border-r-0" // first item
              : i === items.length - 1
                ? "data-[state=inactive]:rounded-l-none border-l-0" // last item
                : "data-[state=inactive]:rounded-l-none data-[state=inactive]:rounded-r-none border-x-0", // middle item
            className,
          )}
        >
          <span className="text-[12px]/[16px] font-medium">{item.label}</span>
        </TabsTrigger>
      ))}
    </TabsList>
  );
};
