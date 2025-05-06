import { shortString } from "starknet";
import { FeltDisplayVariants } from "./FeltDisplayAsToggle";
import { truncateString } from "../utils/string";
import { useScreen } from "../hooks/useScreen";

type FeltDisplayProps = {
  value?: string | bigint | number;
  alwaysTruncate?: boolean;
  truncateLength?: number;
  displayAs?: FeltDisplayVariants;
};

export default function FeltDisplay({
  value,
  displayAs = "hex",
  alwaysTruncate = false,
  truncateLength = 6,
}: FeltDisplayProps) {
  const { isMobile } = useScreen();

  // If value is undefined, display N/A
  if (value === undefined) {
    return (
      <>
        <div className="felt">
          <div className="felt-value">N/A</div>
        </div>
      </>
    );
  }

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
    } catch {
      // Fallback to decimal if string decoding fails
      displayValue = value.toString();
    }
  } else {
    displayValue = felt.toString();
  }

  return (
    <>
      <div className="felt">
        <div className="felt-value">
          {isMobile || alwaysTruncate
            ? truncateString(displayValue, truncateLength)
            : displayValue}
        </div>
      </div>
    </>
  );
}
