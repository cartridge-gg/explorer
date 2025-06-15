import "../src/index.css";

import React from "react";
import { SonnerToaster } from "@cartridge/ui";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { Decorator, Preview } from "@storybook/react-vite";

const providerDecorator: Decorator = (Story) => {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Story />} />
        </Routes>
        <SonnerToaster />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const preview: Preview = {
  tags: ["autodocs"],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [providerDecorator],
};

export default preview;
