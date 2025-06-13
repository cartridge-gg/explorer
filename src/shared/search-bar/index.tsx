import { useSearch } from "@/shared/search-bar/hooks";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn, Input, SearchIcon, Skeleton } from "@cartridge/ui";
import { Hash } from "@/shared/components/hash";
import { useKeydownEffect } from "@/shared/hooks/useKeydownEffect";
import { Badge } from "@/shared/components/badge";
import { useIsFocused } from "@/shared/hooks/useIsFocused";

export function SearchBar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const [value, setValue] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use the extracted search hook
  const { result, isSearching } = useSearch(value);

  const isDropdownOpen = useMemo(() => {
    return value || result || isSearching;
  }, [value, result, isSearching]);
  const isResultFocused = useMemo(() => {
    return value || result;
  }, [value, result]);

  const navigate = useNavigate();
  const onSelectResult = useCallback(() => {
    switch (result?.type) {
      case "tx":
        navigate(`./tx/${result.value}`);
        break;
      case "block":
        navigate(`./block/${result.value}`);
        break;
      case "contract":
        navigate(`./contract/${result.value}`);
        break;
      case "class":
        navigate(`./class/${result.value}`);
        break;
      default:
        break;
    }

    // Reset the search state
    setValue("");

    onNavigate?.();
  }, [navigate, result, onNavigate]);

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
      } else if (e.key === "ArrowDown" && result && isDropdownOpen) {
        e.preventDefault(); // Prevent scrolling
      } else if (
        e.key === "ArrowUp" &&
        result &&
        isDropdownOpen &&
        isResultFocused
      ) {
        e.preventDefault(); // Prevent scrolling
      }
    },
    [result, isResultFocused, isDropdownOpen, onSelectResult],
  );

  // on clicking outside of dropdown, close it
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        e.preventDefault();
        setValue("");
      }
    };

    document.addEventListener("mousedown", onMouseDown);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, []);

  useKeydownEffect((e) => {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      inputRef.current?.focus();
    }
  });

  const isFocused = useIsFocused(inputRef);

  return (
    <div
      className={cn(
        "bg-input min-w-[200px] w-full h-[42px] flex relative border border-background-200 items-center justify-between shadow rounded",
        isDropdownOpen && result ? "border-b-0" : undefined,
        className,
      )}
    >
      <Input
        value={value}
        ref={inputRef}
        containerClassName="w-full flex-1 pl-4"
        className="bg-input border-none focus-visible:bg-input caret-foreground search-input"
        placeholder="Search blocks, transactions, contracts"
        onChange={(e) => {
          setValue(e.target.value);
        }}
        onKeyDown={onKeyDown}
      />

      {!isFocused && <Badge>⌘K</Badge>}

      <div
        className="cursor-pointer flex items-center px-[15px] h-full"
        onClick={() => {
          // Trigger search by setting focus
          inputRef.current?.focus();
        }}
      >
        <SearchIcon />
      </div>

      {isDropdownOpen ? (
        <div
          ref={dropdownRef}
          className="bg-background search-dropdown absolute bottom-0 left-[-1px] right-[-1px] translate-y-full"
        >
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
              <div className="flex px-2 py-2 items-center justify-center text-sm text-foreground-100">
                <Skeleton className="w-full h-[10px] rounded-full" />
              </div>
            ) : result ? (
              <div
                tabIndex={0}
                onKeyDown={onKeyDown}
                onClick={onSelectResult}
                className={cn(
                  "flex flex-row hover:bg-background-400 cursor-pointer items-center gap-2 justify-between w-full px-2 py-1 outline-none",
                  isResultFocused && "bg-background-400",
                )}
              >
                <span className="font-bold uppercase">{result.type}</span>

                <span>
                  <Hash value={result.value} />
                </span>
              </div>
            ) : value ? (
              <div className="flex px-2 py-2 items-center justify-center text-sm lowercase text-foreground-100">
                <div>No results found</div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
