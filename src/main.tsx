import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { queryClient } from "@/services/query_client";
import { QueryClientProvider } from "@tanstack/react-query";
import { StarknetProvider } from "./store/starknetProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <StarknetProvider>
        <App />
      </StarknetProvider>
    </QueryClientProvider>
  </StrictMode>
);
