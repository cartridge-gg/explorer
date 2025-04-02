import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { queryClient } from "@/services/query_client";
import { QueryClientProvider } from "@tanstack/react-query";
import { StarknetProvider } from "./store/starknetProvider";
import { ToastProvider } from "./shared/components/toast";
import { CallCartProvider } from "./store/ShoppingCartProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <StarknetProvider>
        <ToastProvider>
          <CallCartProvider>
            <App />
          </CallCartProvider>
        </ToastProvider>
      </StarknetProvider>
    </QueryClientProvider>
  </StrictMode>
);
