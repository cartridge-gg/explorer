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
    <div className="flex flex-col w-full gap-6 mb-8">
      <div
        onClick={handleNavigation}
        className="w-fit border-l-4 border-[#4A4A4A] flex justify-center items-center cursor-pointer"
      >
        <h1 className=" px-2">explrr .</h1>
      </div>

      <div className="w-full max-w-[467px]">
        <SearchBar />
      </div>
    </div>
  );
}
