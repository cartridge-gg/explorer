import "./App.css";
import { ROUTES } from "./constants/routes";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Header from "./shared/components/header";
import { CallCartProvider } from "./store/ShoppingCartProvider";
import { ToastProvider } from "./shared/components/toast";

function MainContent() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div
      className={`flex flex-col gap-[20px] px-[20px] py-[25px] xl:px-[45px] ${
        isHomePage ? "h-screen" : "lg:h-screen"
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
  return (
    <BrowserRouter
      basename={
        // See <vite.config.ts>.
        import.meta.env.APP_BASE_PATH || "/"
      }
    >
      <ToastProvider>
        <CallCartProvider>
          <MainContent />
        </CallCartProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
