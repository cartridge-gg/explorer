import { Link } from "react-router-dom";
import FeltDisplay from "./FeltDisplay";
import { AnchorHTMLAttributes } from "react";

interface BlockIdDisplayProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  value: bigint | number | string;
  alwaysTruncate?: boolean;
  truncateLength?: number;
}

export default function BlockIdDisplay({
  value,
  alwaysTruncate,
  truncateLength,
  ...props
}: BlockIdDisplayProps) {
  const blockId = ["bigint", "number"].includes(typeof value)
    ? value.toString()
    : value;

  return (
    <Link to={`../block/${blockId}`} className="hover:underline" {...props}>
      {typeof value === "number" ? (
        value
      ) : (
        <FeltDisplay
          value={value}
          alwaysTruncate={alwaysTruncate}
          truncateLength={truncateLength}
        />
      )}
    </Link>
  );
}
