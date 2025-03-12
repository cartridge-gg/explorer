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
      <div className="max-w-[467px]">
        <SearchBar />
      </div>
    </div>
  );
}
