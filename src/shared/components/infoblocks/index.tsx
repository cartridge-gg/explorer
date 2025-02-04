export default function InfoBlock(props: { left: string; right: string }) {
  const { left, right } = props;
  return (
    <div className="px-4 flex flex-row justify-between py-2 bg-[#4A4A4A] min-w-44 gap-10">
      <h1 className="text-white uppercase">{left}</h1>
      <h1 className="text-white uppercase">{right}</h1>
    </div>
  );
}
