import SearchBar from "../search_bar";
import ChainDisplay from "../ChainDisplay";
import AccountDisplay from "../AccountDisplay";

export function Header() {
  return (
    <div className="flex justify-between gap-2">
      <div className="w-[467px]">
        <SearchBar />
      </div>

      <div className="flex gap-[7px]">
        <AccountDisplay />
        <ChainDisplay />
      </div>
    </div>
  );
}
