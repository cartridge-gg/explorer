export interface TxTypeProps {
  type: string;
}

export default function TxType({ type }: TxTypeProps) {
  const upperType = type.toUpperCase();

  let color = "";
  if (upperType === "INVOKE") {
    color = "#FBCB4A";
  } else if (upperType === "DECLARE") {
    color = "#A4ECEB";
  } else if (upperType === "DEPLOY") {
    color = "#E5A4EC";
  } else if (upperType === "DEPLOY_ACCOUNT") {
    color = "#ED7979";
  } else if (upperType === "L1_HANDLER") {
    color = "#9DE4A5";
  } else {
    // default to for unknown type
    color = "#FBCB4A";
  }

  // Sanitize the type by removing underscores and replacing with spaces
  const sanitizedType = type.replace(/_/g, " ");

  return (
    <div
      className="px-2 h-5 flex items-center justify-center font-bold"
      style={{
        color: color || "white",
        border: `1px solid ${color || "var(--borderGray)"}`,
        backgroundColor: color ? `${color}4D` : "transparent", // 4D is 30% opacity in hex
      }}
    >
      {sanitizedType}
    </div>
  );
}
