import SearchBar from "../search_bar";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { ROUTES } from "@/constants/routes";

export default function Header() {
  const navigate = useNavigate();

  const handleNavigation = useCallback(() => {
    navigate(ROUTES.HOME.urlPath);
  }, [navigate]);
  return (
    <div className="mb-8">
      <div
        onClick={handleNavigation}
        className="w-fit border-l-4 border-[#4A4A4A] cursor-pointer mb-4"
      >
        <h1 className=" px-2">explrr .</h1>
      </div>

      <div className="max-w-[467px]">
        <SearchBar />
      </div>
    </div>
  );
}
