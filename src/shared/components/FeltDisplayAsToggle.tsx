import { useMemo } from "react";
import ToggleButton from "./ToggleButton";

export const FeltDisplayVariants = ["hex", "dec", "string"] as const;

type FeltDisplayToggleProps = {
  displayAs?: (typeof FeltDisplayVariants)[number];
  onChange?: (value: (typeof FeltDisplayVariants)[number]) => void;
  asString?: boolean;
  className?: string;
};

export default function FeltDisplayAsToggle({
  onChange,
  displayAs = "hex",
  asString = false,
  className,
}: FeltDisplayToggleProps) {
  const filteredVariants = useMemo(
    () => FeltDisplayVariants.filter((type) => type !== "string" || asString),
    [asString]
  );

  return (
    <ToggleButton
      variants={filteredVariants}
      selected={displayAs}
      onChange={onChange}
      className={className}
    />
  );
}
