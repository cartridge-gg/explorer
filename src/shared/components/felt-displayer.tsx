import { cn } from "@cartridge/ui";
import { useMemo } from "react";
import { Virtuoso } from "react-virtuoso";
import { shortString } from "starknet";

type FeltDisplayerType = "hex" | "dec" | "string";

interface FeltDisplayerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: string | any[];
  className?: string;
  displayAs?: FeltDisplayerType;
}

export function FeltDisplayer({
  value,
  className,
  displayAs = "hex",
}: FeltDisplayerProps) {
  const lines = useMemo(() => {
    let _lines: string[] = [];

    if (Array.isArray(value)) {
      // If it's an array, display each item on its own line
      _lines = value.map((item) => String(item));
    } else if (typeof value === "string") {
      // If it's a string, try to parse as JSON first
      try {
        const parsed = JSON.parse(value);
        // If it's valid JSON, format it nicely and split by lines
        _lines = JSON.stringify(parsed, null, 2).split("\n");
      } catch {
        // If not valid JSON, split by newlines
        _lines = value.split("\n");
      }
    } else {
      _lines = [String(value)];
    }

    // If no data, show placeholder
    if (_lines.length === 0) {
      _lines = ["No data to display"];
    }

    return _lines;
  }, [value]);

  // Calculate the number of digits in the total line count for consistent width
  const lineNumberWidth = useMemo(() => {
    const totalDigits = lines.length.toString().length;
    return `${totalDigits}ch`;
  }, [lines]);

  return (
    <div
      className={cn(
        "bg-spacer border border-background-200 rounded-[5px] overflow-auto font-mono px-[10px] py-[7px] h-full max-h-[80vh]",
        className,
      )}
    >
      <Virtuoso
        style={{ height: "100vh" }}
        className="scrollbar-none"
        totalCount={lines.length}
        data={lines}
        itemContent={(index, line) => {
          const felt = BigInt(line);
          const item =
            displayAs === "dec"
              ? felt.toString()
              : displayAs === "string"
                ? (() => {
                    // Using the existing shortString utility from the codebase
                    // We need to use toString(10) to get the decimal string representation
                    try {
                      shortString.decodeShortString(felt.toString(10));
                    } catch {
                      value.toString();
                    }
                  })()
                : `0x${felt.toString(16)}`;

          return (
            <div className="flex gap-[10px]">
              <div
                className="bg-spacer select-none space-y-[5px]"
                style={{ minWidth: lineNumberWidth }}
              >
                <p className="text-right text-[12px] font-normal text-foreground-400">
                  {index}
                </p>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-[5px]">
                <p className="text-[12px] font-normal whitespace-pre-wrap text-foreground-200">
                  {item}
                </p>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
