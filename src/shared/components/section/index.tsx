export interface SectionBoxEntryProps {
  title: string;
  children?: React.ReactNode;
  bold?: boolean;
}

export function SectionBoxEntry({
  title,
  children,
  bold = true,
}: SectionBoxEntryProps) {
  return (
    <div>
      <div className={`${bold ? "font-bold" : ""} uppercase mb-[5px]`}>
        {title}
      </div>
      <div>{children}</div>
    </div>
  );
}
