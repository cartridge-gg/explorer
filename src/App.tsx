import "./App.css";
import { ROUTES } from "./constants/routes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./shared/components/header";

function App() {
  return (
    <div className="flex flex-col px-[20px] py-[25px] xl:px-[45px] min-h-[600px] sl:h-screen sl:overflow-clip">
      <BrowserRouter>
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
