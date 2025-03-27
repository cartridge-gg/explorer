import "./App.css";
import { ROUTES } from "./constants/routes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./shared/components/header";

function App() {
  return (
    <div className="flex flex-col px-[20px] py-[25px] xl:px-[45px] lg:h-screen">
      <BrowserRouter
        basename={
          // This allow us to set a custom base path for the application. Required when it is exposed in the `katana` under a non-root base path (ie `/explorer`).
          // Also see <vite.config.ts>.
          import.meta.env.VITE_BASE_PATH || "/"
        }
      >
        <Header />
        <Routes>
          {/* Loop over all the routes and render them */}
          {Object.keys(ROUTES).map((routeKey, index) => {
            const route = ROUTES[routeKey as keyof typeof ROUTES];
            return (
              <Route
                key={index}
                path={route.urlPath}
                element={route.component}
              />
            );
          })}
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
