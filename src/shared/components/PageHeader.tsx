import React from "react";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtext?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtext,
  ...props
}: PageHeaderProps) {
  return (
    <div className="rounded-md overflow-clip" {...props}>
      <div className="px-4 bg-[#4A4A4A] h-[50px] flex items-center rounded-t-md">
        <h1 className="text-white uppercase text-lg">{title}</h1>
      </div>

      {subtext && (
        <div className="px-4 bg-[#F1F1F1] border border-[#D0D0D0] border-t-0 h-[30px] flex items-center rounded-b-md">
          <div className="text-sm text-[#4A4A4A]">{subtext}</div>
        </div>
      )}
    </div>
  );
}
