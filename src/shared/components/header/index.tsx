import SearchBar from "../search_bar";
import InfoBlock from "../infoblocks";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { ROUTES } from "@/constants/routes";

export default function Header() {
  const navigate = useNavigate();

  const handleNavigation = useCallback(() => {
    navigate(ROUTES.HOME.urlPath);
  }, [navigate]);
  return (
    <div className="flex flex-col w-full gap-8 px-2 py-4">
      <div
        onClick={handleNavigation}
        className="w-fit border-l-4 border-[#4A4A4A] flex justify-center items-center cursor-pointer"
      >
        <h1 className=" px-2">explrr .</h1>
      </div>
      <div className="flex flex-col w-full gap-16">
        <div className="flex flex-col lg:flex-row w-full lg:gap-12 gap-4">
          <div className="w-full">
            <SearchBar />
          </div>
          {/* <div className="w-full flex flex-col md:flex-row gap-2 lg:justify-end justify-between">
            <InfoBlock left="Blocks" right="1,202,512" />
            <InfoBlock left="Txs" right="1,202,512" />
            <InfoBlock left="Classes" right="1,202,512" />
            <InfoBlock left="Contracts" right="1,202,512" />
          </div> */}
        </div>
      </div>
    </div>
  );
}
