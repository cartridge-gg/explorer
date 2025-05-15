import { cn } from "@cartridge/ui-next";

export interface SectionBoxEntryProps {
  title: string;
  children?: React.ReactNode;
  bold?: boolean;
  className?: string;
}

export function SectionBoxEntry({
  title,
  children,
  bold = true,
  className,
}: SectionBoxEntryProps) {
  return (
    <div>
      <div
        className={cn(
          `uppercase mb-[5px]`,
          bold ? "font-bold" : undefined,
          className,
        )}
      >
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}
