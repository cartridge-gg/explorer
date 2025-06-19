import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  cn,
  FilterIcon,
} from "@cartridge/ui";
import React from "react";

interface Props {
  placeholder?: string;
  buttonClassName?: string;
  items: Array<{ key: string; value: string }>;
}

export const SingleFilterTransaction = ({
  placeholder,
  buttonClassName,
  items,
  ...props
}: React.ComponentProps<typeof Select> & Props) => {
  return (
    <Select {...props}>
      <div className="px-[5px] bg-background-500 rounded-sm group hover:bg-background-400 w-fit">
        <SelectTrigger
          className={cn(
            "gap-[4px] h-[22px] bg-background-500 group-hover:bg-background-400 p-0",
            buttonClassName,
          )}
        >
          <FilterIcon
            variant="solid"
            className="w-[16px] h-[16px] text-foreground-200"
          />
          <span className="font-medium text-[12px]/[16px] font-sans normal-case text-foreground-200">
            {placeholder || "Filter"}
          </span>
        </SelectTrigger>
      </div>
      <SelectContent>
        {items.map((item, index) => (
          <SelectItem key={index} value={item.key}>
            {item.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
