import "./App.css";
import { ROUTES } from "./constants/routes";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./shared/components/header";

export function App() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const fullScreen = isHomePage || !Object
    .values(ROUTES)
    .map(r => r.urlPath)
    .includes(location.pathname)

  return (
    <div
      className={`flex flex-col gap-[20px] px-[20px] py-[25px] xl:px-[45px] w-full min-w-[320px] ${fullScreen ? "h-screen" : "lg:h-screen"
        }`}
    >
      {!isHomePage && <Header />}

      <Routes>
        {Object.keys(ROUTES).map((routeKey, index) => {
          const route = ROUTES[routeKey as keyof typeof ROUTES];
          return (
            <Route key={index} path={route.urlPath} element={route.component} />
          );
        })}
      </Routes>
    </div>
  );
}
