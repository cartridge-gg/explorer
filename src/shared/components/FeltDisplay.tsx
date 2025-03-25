type FeltDisplayProps = {
  value: bigint | number;
  displayAs?: "hex" | "decimal";
};

export default function FeltDisplay({
  value,
  displayAs = "decimal",
}: FeltDisplayProps) {
  // Parse the value as bigint first
  const felt = BigInt(value);
  const displayValue =
    displayAs === "hex" ? `0x${felt.toString(16)}` : felt.toString();

  return (
    <>
      <div className="felt">
        <div className="felt-value">{displayValue}</div>
      </div>
    </>
  );
}
