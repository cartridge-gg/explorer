import { SearchBar } from "@/shared/components/SearchBar";
import AccountDisplay from "../AccountDisplay";

export function Header() {
  return (
    <div className="flex justify-between gap-2">
      <div className="w-[467px]">
        <SearchBar />
      </div>

      <div className="flex gap-[7px]">
        <AccountDisplay />
      </div>
    </div>
  );
}
