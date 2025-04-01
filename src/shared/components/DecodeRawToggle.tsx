import ToggleButton from "./ToggleButton";

export const CalldataEncodingVariants = ["decoded", "raw"] as const;

type CalldataEncodingToggleProps = {
  displayAs?: (typeof CalldataEncodingVariants)[number];
  onChange?: (value: (typeof CalldataEncodingVariants)[number]) => void;
  className?: string;
};

export default function CalldataEncodingToggle({
  onChange,
  displayAs = "decoded",
  className,
}: CalldataEncodingToggleProps) {
  return (
    <ToggleButton
      variants={CalldataEncodingVariants}
      selected={displayAs}
      onChange={onChange}
      className={className}
    />
  );
}
