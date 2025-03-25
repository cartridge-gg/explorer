import FeltDisplayAsToggle from "@/shared/components/FeltDisplayAsToggle";
import FeltList from "@/shared/components/FeltList";
import { useState } from "react";

type SignaureDisplayProps = {
  signature: string[];
};

export default function SignatureDisplay({ signature }: SignaureDisplayProps) {
  const [displayAs, setDisplayAs] = useState<"decimal" | "hex">("hex");

  return (
    <>
      <FeltDisplayAsToggle onChange={(value) => setDisplayAs(value)} />
      <FeltList list={signature} displayAs={displayAs} />
    </>
  );
}
