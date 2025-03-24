import FeltList from "@/shared/components/FeltList";

type SignaureDisplayProps = {
  signature: string[];
};

export default function SignatureDisplay({ signature }: SignaureDisplayProps) {
  return (
    <>
      <FeltList list={signature} />
    </>
  );
}
