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
    <div className="overflow-clip" {...props}>
      <div className="px-4 w-full justify-between bg-primary h-[40px] flex items-center">
        <h1 className="page-header-title text-white uppercase text-lg">
          {title}
        </h1>
        {titleRightComponent ? titleRightComponent : null}
      </div>

      {subtext && (
        <div className="px-4 w-full justify-between bg-[#F1F1F1] border border-borderGray border-t-0 h-[25px] flex items-center capitalize">
          <div className="text-sm text-[#4A4A4A]">{subtext}</div>
          {subtextRightComponent ? subtextRightComponent : null}
        </div>
      )}
    </div>
  );
}
