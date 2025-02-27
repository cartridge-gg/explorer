"use client";
import React from "react";
import { sepolia, mainnet } from "@starknet-react/chains";
import {
  StarknetConfig,
  jsonRpcProvider,
  useInjectedConnectors,
  argent,
  braavos,
} from "@starknet-react/core";
import { Connector, InjectedConnector } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import { constants } from "starknet";
import { WebWalletConnector } from "starknetkit/webwallet";

// TODO: not sure why this condition works when reversed
const CHAIN_ID = import.meta.env.VITE_IS_TESTNET
  ? constants.StarknetChainId.SN_MAIN
  : constants.StarknetChainId.SN_SEPOLIA;

export const cartridge_controller = new ControllerConnector({
  chains: [
    {
      rpcUrl: import.meta.env.VITE_RPC_URL,
    },
  ],
  defaultChainId: CHAIN_ID,
});

const connectors = [cartridge_controller];

export const availableConnectors: Connector[] = [
  connectors[0],
  new InjectedConnector({ options: { id: "argentX", name: "Argent X" } }),
  new InjectedConnector({ options: { id: "braavos", name: "Braavos" } }),
  new WebWalletConnector({ url: "https://web.argent.xyz" }),
];

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  const providers = jsonRpcProvider({
    rpc: () => ({
      nodeUrl: import.meta.env.VITERPC_URL as string,
    }),
  });

  const { connectors } = useInjectedConnectors({
    // Show these connectors if the user has no connector installed.
    recommended: [argent(), braavos()],
    // Hide recommended connectors if the user has any connector installed.
    includeRecommended: "onlyIfNoConnectors",
    // Randomize the order of the connectors.
    order: "random",
  });

  return (
    <StarknetConfig
      chains={[import.meta.env.VITE_IS_TESTNET ? sepolia : mainnet]}
      provider={providers}
      connectors={connectors}
    >
      {children}
    </StarknetConfig>
  );
}
