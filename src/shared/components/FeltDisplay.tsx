import { shortString } from "starknet";
import { FeltDisplayVariants } from "./FeltDisplayAsToggle";

type FeltDisplayProps = {
  value: bigint | number;
  displayAs?: (typeof FeltDisplayVariants)[number];
};

export default function FeltDisplay({
  value,
  displayAs = "dec",
}: FeltDisplayProps) {
  // Parse the value as bigint first
  const felt = BigInt(value);
  let displayValue: string;

  if (displayAs === "hex") {
    displayValue = `0x${felt.toString(16)}`;
  } else if (displayAs === "string") {
    try {
      // Using the existing shortString utility from the codebase
      // We need to use toString(10) to get the decimal string representation
      displayValue = shortString.decodeShortString(felt.toString(10));
    } catch (error) {
      // Fallback to decimal if string decoding fails
      displayValue = value.toString();
    }
  } else {
    displayValue = felt.toString();
  }

  return (
    <>
      <div className="felt">
        <div className="felt-value">{displayValue}</div>
      </div>
    </>
  );
}
