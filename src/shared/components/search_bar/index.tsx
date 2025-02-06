import { Input } from "@cartridge/ui-next";

export default function SearchBar() {
  return (
    <Input
      className=" border-l-4 border-[#8E8E8E] w-full lowercase px-2 focus:outline-none focus:ring-0"
      placeholder="search"
    />
  );
}
