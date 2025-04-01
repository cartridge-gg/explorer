import { useMemo } from "react";
import ToggleButton from "./ToggleButton";

const FeltDisplayVariantsSet = ["hex", "dec", "string"] as const;
export type FeltDisplayVariants = (typeof FeltDisplayVariantsSet)[number];

type FeltDisplayToggleProps = {
  displayAs?: FeltDisplayVariants;
  onChange?: (value: FeltDisplayVariants) => void;
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
    () =>
      FeltDisplayVariantsSet.filter((type) => type !== "string" || asString),
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
