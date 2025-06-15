import { useCallback, useRef, useState } from "react";
import { cn, Input, SearchIcon, Skeleton, Spinner } from "@cartridge/ui";
import { Hash } from "@/shared/components/hash";
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
        "bg-input min-w-[200px] w-full h-[42px] flex relative border border-background-200 items-center justify-between shadow rounded",
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
        className="bg-input border-none focus-visible:bg-input caret-foreground search-input px-0 font-inter"
        placeholder="Search"
        onChange={(e) => {
          setValue(e.target.value);
        }}
        onKeyDown={onKeyDown}
      />

      {!isFocused && !isMobile && (
        <div className="flex items-center justify-center h-full aspect-square">
          <Badge
            onClick={() => {
              inputRef.current?.focus();
            }}
            className="cursor-pointer"
          >
            {isMac ? "⌘K" : "Ctrl+K"}
          </Badge>
        </div>
      )}

      {(value || result || isSearching) && (
        <div className="bg-input absolute bottom-0 left-[-1px] right-[-1px] translate-y-full rounded-b border-dashed border-t border-background-200">
          <div
            // hack for doing custom spacing for the dashed line
            style={{
              backgroundImage:
                "linear-gradient(to right, var(--background) 50%, var(--background-400) 0%)",
              backgroundPosition: "top",
              backgroundSize: "15px 1px",
              backgroundRepeat: "repeat-x",
            }}
            className="flex flex-col gap-2 px-[15px] py-[10px] border border-background-200 border-t-0 shadow-md"
          >
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
                  "flex flex-row hover:bg-background-400 cursor-pointer items-center gap-2 justify-between w-full p-4 outline-none rounded h-10",
                  result && "bg-background-400",
                )}
              >
                <span className="font-bold uppercase">{result.type}</span>

                <span>
                  <Hash value={result.value} />
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
