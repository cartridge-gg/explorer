import { useCallback, useRef, useState } from "react";
import { cn, Input, SearchIcon, Skeleton, Spinner } from "@cartridge/ui";
import { useKeydownEffect } from "@/shared/hooks/useKeydownEffect";
import { Badge } from "@/shared/components/badge";
import { useIsFocused } from "@/shared/hooks/useIsFocused";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useScreen } from "@/shared/hooks/useScreen";
import { useSearch } from "./hooks";
import { isMac } from "@/constants/device";

export function SearchBar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const [value, setValue] = useState("");
  const searchBarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isMobile } = useScreen();

  // Use the extracted search hook
  const debouncedValue = useDebounce(value, 300);
  const { result, isSearching } = useSearch(debouncedValue);
  const isFocused = useIsFocused(inputRef);

  const onSelectResult = useCallback(() => {
    if (!result) return;
    result.onSelect();
    setValue("");
    onNavigate?.();
  }, [result, onNavigate]);

  // Handle keyboard navigation
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && result) {
        e.preventDefault();
        onSelectResult();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setValue("");
        inputRef.current?.blur();
      } else if (e.key === "ArrowDown" && isFocused && result) {
        e.preventDefault(); // Prevent scrolling
      } else if (e.key === "ArrowUp" && isFocused && result) {
        e.preventDefault(); // Prevent scrolling
      }
    },
    [result, onSelectResult, isFocused],
  );

  // on clicking outside of dropdown, close it
  useClickOutside(searchBarRef, () => setValue(""));

  useKeydownEffect((e) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      inputRef.current?.focus();
    }
  });

  return (
    <div
      className={cn(
        "bg-spacer-100 min-w-[200px] w-full h-[42px] flex relative border border-background-200 items-center justify-between shadow rounded-sm",
        value || result || isSearching ? "border-b-none rounded-b-none" : "",
        className,
      )}
      ref={searchBarRef}
    >
      <div
        className="cursor-pointer flex items-center justify-center h-full aspect-square"
        onClick={() => {
          if (isSearching) return;
          // Trigger search by setting focus
          inputRef.current?.focus();
        }}
      >
        {isSearching ? (
          <Spinner />
        ) : (
          <SearchIcon
            className={isFocused ? "text-foreground" : "text-foreground-400"}
          />
        )}
      </div>
      <Input
        value={value}
        ref={inputRef}
        containerClassName="w-full flex-1"
        className="bg-spacer-100 border-none focus-visible:bg-spacer-100 caret-foreground search-input px-0 font-inter placeholder:font-mono placeholder:text-[14px]/[20px] placeholder:font-normal"
        placeholder="Search"
        onChange={(e) => {
          setValue(e.target.value);
        }}
        onKeyDown={onKeyDown}
      />

      {!isFocused && !isMobile && (
        <Badge
          onClick={() => {
            inputRef.current?.focus();
          }}
          className="cursor-pointer mr-[12px] px-[8px]"
        >
          <span className="text-foreground-100 font-semibold text-[12px]/[16px]">
            {isMac ? "⌘K" : "Ctrl+K"}
          </span>
        </Badge>
      )}

      {(value || result || isSearching) && (
        <div className="bg-background-100 absolute bottom-0 left-[-1px] right-[-1px] translate-y-full border-dashed border-t border-background-200">
          <div className="flex flex-col gap-2 p-[10px] border border-background-200 border-t-0 shadow-sm rounded-b-sm">
            {isSearching ? (
              <div className="flex px-2 py-2 items-center justify-center text-sm text-foreground-100 h-10">
                <Skeleton className="w-full h-[10px] rounded-full" />
              </div>
            ) : result ? (
              <div
                tabIndex={0}
                onKeyDown={onKeyDown}
                onClick={onSelectResult}
                className={cn(
                  "flex flex-row hover:bg-background-400 cursor-pointer items-center gap-[100px] justify-between w-full p-4 outline-none rounded-sm h-10",
                  result && "bg-background-400",
                )}
              >
                <span className="font-semibold text-[12px]/[16px] text-[#A8A8A8] capitalize">
                  {result.type}
                </span>

                <span className="font-mono font-normal text-[13px]/[16px] text-foreground-400 overflow-ellipsis overflow-hidden whitespace-nowrap flex-1 text-right">
                  {result.value}
                </span>
              </div>
            ) : (
              <div className="flex px-2 py-2 items-center justify-center text-sm text-foreground-400">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
