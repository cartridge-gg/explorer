export interface SectionBoxEntryProps {
  title: string;
  value: string;
}

export function SectionBoxEntry({ title, value }: SectionBoxEntryProps) {
  return (
    <div className="">
      <div className="font-bold uppercase">{title}</div>
      <div className="">{value}</div>
    </div>
  );
}
