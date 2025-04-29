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

function getEmbeddedBasename(): string {
  // More robust basename determination
  // Determine if we're at the root or in a subdirectory
  const pathname = window.location.pathname;

  // Check if pathname contains '/explorer'
  if (pathname.includes("/explorer")) {
    // Use everything up to and including '/explorer/'
    const explorerIndex = pathname.indexOf("/explorer");
    const endIndex = pathname.indexOf("/", explorerIndex + 1);

    if (endIndex !== -1) {
      return pathname.substring(0, endIndex + 1);
    } else {
      return pathname.endsWith("/") ? pathname : pathname + "/";
    }
  }
  // Fallback to original logic if '/explorer' not found
  else {
    return pathname.endsWith("/")
      ? pathname
      : pathname.substring(0, pathname.lastIndexOf("/") + 1);
  }
}

function App() {
  const basename =
    // See <vite.config.ts>.
    import.meta.env.APP_IS_EMBEDDED ? getEmbeddedBasename() : "/";

  return (
    <BrowserRouter basename={basename}>
      <MainContent />
    </BrowserRouter>
  );
}

export default App;
