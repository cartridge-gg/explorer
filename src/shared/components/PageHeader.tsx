import React from "react";

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtext?: React.ReactNode;
  titleRightComponent?: React.ReactNode;
  subtextRightComponent?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtext,
  titleRightComponent,
  subtextRightComponent,
  ...props
}: PageHeaderProps) {
  return (
    <div className="rounded-md overflow-clip" {...props}>
      <div className="px-4 w-full justify-between bg-primary h-[50px] flex items-center rounded-t-md">
        <h1 className="text-white uppercase text-lg">{title}</h1>
        {titleRightComponent ? titleRightComponent : null}
      </div>

      {subtext && (
        <div className="px-4 w-full justify-between bg-[#F1F1F1] border border-[#D0D0D0] border-t-0 h-[30px] flex items-center rounded-b-md capitalize">
          <div className="text-sm text-[#4A4A4A]">{subtext}</div>
          {subtextRightComponent ? subtextRightComponent : null}
        </div>
      )}
    </div>
  );
}
