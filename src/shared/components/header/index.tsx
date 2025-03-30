import SearchBar from "../search_bar";
import ChainDisplay from "../ChainDisplay";

export default function Header() {
  return (
    <div className="mb-8 flex justify-between">
      <div className="w-[467px]">
        <SearchBar />
      </div>

      <ChainDisplay />
    </div>
  );
}
