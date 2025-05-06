import { useNavigate } from "react-router-dom";
import FeltDisplay from "./FeltDisplay";
import { ROUTES } from "@/constants/routes";
import { useCallback } from "react";
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
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    const contractAddress = BigInt(value).toString(16);
    navigate(
      ROUTES.CONTRACT_DETAILS.urlPath.replace(
        ":contractAddress",
        `0x${contractAddress}`
      )
    );
  }, [value, navigate]);

  return (
    <a
      className="cursor-pointer hover:underline"
      onClick={handleClick}
      {...props}
    >
      <FeltDisplay
        value={value}
        displayAs="hex"
        alwaysTruncate={alwaysTruncate}
        truncateLength={truncateLength}
      />
    </a>
  );
}
