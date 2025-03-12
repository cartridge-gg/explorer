import React, { CSSProperties } from "react";

export type SectionBoxVariant = "full" | "upper-half";

export interface SectionBoxProps {
  title?: string;
  children?: React.ReactNode;
  variant?: SectionBoxVariant;
}

export function SectionBox({
  title,
  children,
  variant = "full",
}: SectionBoxProps) {
  const customStyles: CSSProperties = {};

  if (variant === "upper-half") {
    customStyles.borderBottomStyle = "dashed";
    customStyles.boxShadow = "0 2px 2px rgba(183, 183, 183, 0.25)";
  }

  return (
    <div
      style={customStyles}
      className={`${
        variant !== "full" ? "rounded-t-md" : "rounded-md"
      } flex-grow border border-[#D0D0D0]`}
    >
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
    <div className="px-[15px] py-[5px] bg-[#F1F1F1] border-b border-borderGray text-pimary uppercase font-bold">
      {title}
    </div>
  );
}
