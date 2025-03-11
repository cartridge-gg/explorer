export interface SectionBoxEntryProps {
  title: string;
  value: string;
}

export function SectionBoxEntry({ title, value }: SectionBoxEntryProps) {
  return (
    <div>
      <div className="font-bold uppercase mb-[2px]">{title}</div>
      <div className="">{value}</div>
    </div>
  );
}
