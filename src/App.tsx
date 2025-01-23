import "./App.css";
import Home from "./modules/Home/page";

function App() {
  return (
    <div className="bg-black h-screen w-screen flex justify-center items-center">
      {/* Home page - we can conditionally render any other flow if home page is not supposed to be shown */}
      <Home />
    </div>
  );
}

export default App;
