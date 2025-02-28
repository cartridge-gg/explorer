"use client";
import React from "react";
import { sepolia, mainnet } from "@starknet-react/chains";
import {
  StarknetConfig,
  jsonRpcProvider,
  useInjectedConnectors,
} from "@starknet-react/core";
import { Connector, InjectedConnector } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import { constants } from "starknet";
import { WebWalletConnector } from "starknetkit/webwallet";

// TODO: not sure why this condition works when reversed
const CHAIN_ID =
  import.meta.env.VITE_IS_TESTNET === "true"
    ? constants.StarknetChainId.SN_SEPOLIA
    : constants.StarknetChainId.SN_MAIN;

console.log(typeof import.meta.env.VITE_IS_TESTNET);
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

  const { connectors } = useInjectedConnectors({});

  return (
    <StarknetConfig
      chains={[import.meta.env.VITE_IS_TESTNET === "true" ? sepolia : mainnet]}
      provider={providers}
      connectors={connectors}
    >
      {children}
    </StarknetConfig>
  );
}
