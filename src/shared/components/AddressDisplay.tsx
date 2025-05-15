import { Link } from "react-router-dom";
import FeltDisplay from "./FeltDisplay";
import { AnchorHTMLAttributes } from "react";

interface AddressDisplayProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  value: string | bigint | number;
  alwaysTruncate?: boolean;
  truncateLength?: number;
}

export default function AddressDisplay({
  value,
  alwaysTruncate,
  truncateLength,
  ...props
}: AddressDisplayProps) {
  return (
    <Link
      to={`../contract/${BigInt(value).toString(16)}`}
      className="hover:underline"
      {...props}
    >
      <FeltDisplay
        value={value}
        displayAs="hex"
        alwaysTruncate={alwaysTruncate}
        truncateLength={truncateLength}
      />
    </Link>
  );
}
