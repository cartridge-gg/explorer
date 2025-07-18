import {
  cn,
  FilterIcon,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  TimesCircleIcon,
  CheckboxCheckedIcon,
  CheckboxUncheckedIcon,
} from "@cartridge/ui";
import React, { useState } from "react";

interface MultiSelectProps {
  buttonClassName?: string;
  placeholder?: string;
  items: Array<{ key: string; value: string }>;
  value?: string[];
  onValueChange?: (value: string[]) => void;
}

export const MultiFilter = ({
  buttonClassName,
  placeholder,
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

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the popover
    onValueChange?.([]);
  };

  const getSelectedItems = () => {
    return items.filter((item) => value.includes(item.key));
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "px-[5px] bg-background-500 rounded-sm hover:bg-background-400 gap-[4px] h-[22px] border border-[#454B46] w-fit",
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

          <div className="flex items-center">
            {getSelectedItems().map((item, index) => (
              <span
                key={item.key}
                className="font-medium text-[12px]/[16px] font-sans normal-case text-foreground-100"
              >
                {index > 0 && ", "}
                {item.value.trim()}
              </span>
            ))}
          </div>

          {/* Clear all button */}
          {value.length > 0 && (
            <button onClick={handleClearAll} aria-label="Clear all filters">
              <TimesCircleIcon className="w-[13px] h-[13px] text-foreground-100 hover:text-destructive-100" />
            </button>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={4}
        alignOffset={0}
        className="w-56 p-2 border-[#454B46]"
      >
        <div className="space-y-[5px]">
          {items.map((item) => (
            <div
              key={item.key}
              className="flex items-center space-x-[5px] w-full p-[5px] rounded-sm cursor-pointer hover:bg-background-400 transition-colors duration-150"
              onClick={() => handleToggle(item.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleToggle(item.key);
                }
              }}
              aria-label={`Toggle ${item.value} filter`}
            >
              {value.includes(item.key) ? (
                <CheckboxCheckedIcon className="w-[13px] h-[13px] text-foreground-100" />
              ) : (
                <CheckboxUncheckedIcon className="w-[13px] h-[13px] text-foreground-100" />
              )}
              <label
                htmlFor={item.key}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none flex-1"
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
