import "./App.css";
import { ROUTES } from "./constants/routes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./shared/components/header";

function App() {
  return (
    <div className="bg-white flex flex-col px-[20px] py-[25px] lg:px-[45px]">
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
