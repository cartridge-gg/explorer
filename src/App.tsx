import "./App.css";
import { ROUTES } from "./constants/routes";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Header from "./shared/components/header";

function MainContent() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div
      className={`flex flex-col gap-[20px] px-[20px] py-[25px] xl:px-[45px] w-full min-w-[320px] ${isHomePage ? "h-screen" : "lg:h-screen"
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

function App() {
  // More robust basename determination
  // Determine if we're at the root or in a subdirectory
  const pathname = window.location.pathname;
  const basename = pathname.endsWith("/")
    ? pathname
    : pathname.substring(0, pathname.lastIndexOf("/") + 1);

  return (
    <BrowserRouter basename={basename}>
      <MainContent />
    </BrowserRouter>
  );
}

export default App;
