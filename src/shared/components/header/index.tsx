import SearchBar from "../search_bar";
import ChainDisplay from "../ChainDisplay";
import WalletConnectModal from "../wallet_connect";
import AccountDisplay from "../AccountDisplay";

export default function Header() {
  return (
    <>
      <div className="flex justify-between">
        <div className="w-[467px]">
          <SearchBar />
        </div>
        <div className="flex gap-[7px]">
          <AccountDisplay />
          <ChainDisplay />
        </div>
      </div>
    </>
  );
}
