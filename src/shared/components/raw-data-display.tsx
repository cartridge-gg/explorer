import { cn } from "@cartridge/ui";

interface RawDataDisplayProps {
  data: string | any[];
  className?: string;
}

export function RawDataDisplay({ data, className = "" }: RawDataDisplayProps) {
  let lines: string[] = [];

  if (Array.isArray(data)) {
    // If it's an array, display each item on its own line
    lines = data.map((item) => String(item));
  } else if (typeof data === "string") {
    // If it's a string, try to parse as JSON first
    try {
      const parsed = JSON.parse(data);
      // If it's valid JSON, format it nicely and split by lines
      lines = JSON.stringify(parsed, null, 2).split("\n");
    } catch {
      // If not valid JSON, split by newlines
      lines = data.split("\n");
    }
  } else {
    lines = [String(data)];
  }

  return (
    <div
      className={cn(
        "bg-spacer border border-background-200 rounded-[5px] overflow-auto font-mono px-[10px] py-[7px] max-h-[80vh]",
        className,
      )}
    >
      <div className="flex gap-[10px]">
        {/* Line numbers */}
        <div className="bg-spacer select-none space-y-[5px]">
          {lines.map((_, index) => (
            <p
              key={index}
              className="text-right text-[12px] font-normal text-foreground-400 "
            >
              {index + 1}
            </p>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-[5px]">
          {lines.map((line, index) => (
            <p
              key={index}
              className="text-[12px] font-normal whitespace-pre-wrap text-foreground-200"
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
