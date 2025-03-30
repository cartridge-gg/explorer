import SearchBar from "../search_bar";
import ChainDisplay from "../ChainDisplay";

export default function Header() {
  return (
    <div className="flex justify-between">
      <div className="w-[467px]">
        <SearchBar />
      </div>

      <ChainDisplay />
    </div>
  );
}
