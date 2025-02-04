import "./App.css";
import { ROUTES } from "./constants/routes";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <div className="bg-white flex">
      {/* Home page - we can conditionally render any other flow if home page is not supposed to be shown */}
      <BrowserRouter>
        <Routes>
          {/* Loop over all the routes and render them */}
          {Object.keys(ROUTES).map((routeKey) => {
            const route = ROUTES[routeKey as keyof typeof ROUTES];
            return <Route path={route.urlPath} element={route.component} />;
          })}
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
