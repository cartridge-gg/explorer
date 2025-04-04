import { useNavigate } from "react-router-dom";
import FeltDisplay from "./FeltDisplay";
import { ROUTES } from "@/constants/routes";
import { useCallback } from "react";
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
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    let blockId = value;

    // If value is bigint or number, convert it
    if (typeof value === "bigint") {
      blockId = value.toString();
    } else if (typeof value === "number") {
      blockId = value.toString();
    }

    navigate(
      ROUTES.BLOCK_DETAILS.urlPath.replace(":blockId", blockId.toString())
    );
  }, [value, navigate]);

  return (
    <a
      className="cursor-pointer hover:underline"
      onClick={handleClick}
      {...props}
    >
      {typeof value === "number" ? (
        value
      ) : (
        <FeltDisplay
          value={value}
          alwaysTruncate={alwaysTruncate}
          truncateLength={truncateLength}
        />
      )}
    </a>
  );
}
