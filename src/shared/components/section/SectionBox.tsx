import React from "react";

export interface SectionBoxProps {
  title?: string;
  children?: React.ReactNode;
}

export function SectionBox({ title, children }: SectionBoxProps) {
  return (
    <div className="bg-white border border-borderGray">
      {title ? <SectionBoxHeader title={title} /> : <></>}
      <div className="flex flex-col gap-2 p-[15px]">{children}</div>
    </div>
  );
}

interface SectionBoxHeaderProps {
  title: string;
}

function SectionBoxHeader({ title }: SectionBoxHeaderProps) {
  return (
    <div className="flex items-center px-[15px] h-[23px] bg-[#F1F1F1] border-b border-borderGray uppercase font-bold">
      {title}
    </div>
  );
}
