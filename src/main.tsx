import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { queryClient } from "@/services/query";
import { QueryClientProvider } from "@tanstack/react-query";
import { StarknetProvider } from "./store/starknetProvider";
import { CallCartProvider } from "./store/ShoppingCartProvider";
import { BlockNumberProvider } from "./store/BlockNumberProvider";
import { BrowserRouter } from "react-router-dom";
import { getBasePath } from "./services/rpc";
import { PostHogProvider } from "./store/PostHogProvider";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { SonnerToaster } from "@cartridge/ui";

dayjs.extend(relativeTime);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <StarknetProvider>
        <PostHogProvider>
          <BrowserRouter basename={getBasePath()}>
            <CallCartProvider>
              <BlockNumberProvider>
                <App />
                <SonnerToaster />
              </BlockNumberProvider>
            </CallCartProvider>
          </BrowserRouter>
        </PostHogProvider>
      </StarknetProvider>
    </QueryClientProvider>
  </StrictMode>,
);
