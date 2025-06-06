import "../src/index.css";

import React from "react";
import { StarknetProvider } from "../src/store/starknetProvider";
import { SonnerToaster } from "@cartridge/ui";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import type { Decorator, Preview } from "@storybook/react-vite";

const providerDecorator: Decorator = (Story) => {
  return (
    <StarknetProvider>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<Story />} />
        </Routes>
        <SonnerToaster />
      </MemoryRouter>
    </StarknetProvider>
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
