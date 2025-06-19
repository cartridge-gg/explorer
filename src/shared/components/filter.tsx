import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  cn,
  FilterIcon,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Checkbox,
} from "@cartridge/ui";
import React, { useState } from "react";

interface Props {
  buttonClassName?: string;
  items: Array<{ key: string; value: string }>;
}

export const FilterTransaction = ({
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
          <FilterIcon variant="solid" />
          <span>Filter</span>
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

interface MultiSelectProps {
  buttonClassName?: string;
  items: Array<{ key: string; value: string }>;
  value?: string[];
  onValueChange?: (value: string[]) => void;
}

export const MultiFilterTransaction = ({
  buttonClassName,
  items,
  value = [],
  onValueChange,
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (itemKey: string) => {
    const newValue = value.includes(itemKey)
      ? value.filter((v) => v !== itemKey)
      : [...value, itemKey];
    onValueChange?.(newValue);
  };

  const getDisplayText = () => {
    if (value.length === 0) return "All";
    if (value.length === 1) {
      const item = items.find((item) => item.key === value[0]);
      return item?.value || "Selected";
    }
    return `${value.length} selected`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "px-[5px] bg-background-500 rounded-sm hover:bg-background-400 w-fit gap-[4px] h-[22px] border border-[#454B46]",
            buttonClassName,
          )}
        >
          <FilterIcon variant="solid" className="w-[16px] h-[16px]" />
          <span className="font-medium text-[12px]/[16px] font-sans normal-case">
            Filter
          </span>
          {/* <span>{getDisplayText()}</span> */}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2">
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.key} className="flex items-center space-x-2">
              <Checkbox
                id={item.key}
                checked={value.includes(item.key)}
                onCheckedChange={() => handleToggle(item.key)}
              />
              <label
                htmlFor={item.key}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
              >
                {item.value}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
