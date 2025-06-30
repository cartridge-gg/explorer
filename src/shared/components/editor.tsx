import { cn } from "@cartridge/ui";
import { Virtuoso } from "react-virtuoso";

interface EditorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: string | any[];
  className?: string;
}

export function Editor({ value, className }: EditorProps) {
  let lines: string[] = [];

  if (Array.isArray(value)) {
    // If it's an array, display each item on its own line
    lines = value.map((item) => String(item));
  } else if (typeof value === "string") {
    // If it's a string, try to parse as JSON first
    try {
      const parsed = JSON.parse(value);
      // If it's valid JSON, format it nicely and split by lines
      lines = JSON.stringify(parsed, null, 2).split("\n");
    } catch {
      // If not valid JSON, split by newlines
      lines = value.split("\n");
    }
  } else {
    lines = [String(value)];
  }

  // If no data, show placeholder
  if (lines.length === 0) {
    lines = ["No data to display"];
  }

  return (
    <div
      className={cn(
        "bg-spacer border border-background-200 rounded-[5px] overflow-auto font-mono px-[10px] py-[7px] max-h-[80vh]",
        className,
      )}
    >
      <Virtuoso
        style={{ height: "100vh" }}
        data={lines}
        itemContent={(index, line) => (
          <div className="flex gap-[10px]">
            <div className="bg-spacer select-none space-y-[5px]">
              <p className="text-right text-[12px] font-normal text-foreground-400 ">
                {index}
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-[5px]">
              <p className="text-[12px] font-normal whitespace-pre-wrap text-foreground-200">
                {line}
              </p>
            </div>
          </div>
        )}
      />
    </div>
  );
}
