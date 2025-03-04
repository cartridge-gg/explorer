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
import { WebWalletConnector } from "starknetkit/webwallet";
import { CHAIN_ID, RPC_URL } from "@/constants/rpc";

const ENABLE_CONTROLLER =
  window.ENABLE_CONTROLLER ?? import.meta.env.VITE_ENABLE_CONTROLLER === "true";

export const cartridge_controller = ENABLE_CONTROLLER
  ? new ControllerConnector({
      chains: [
        {
          rpcUrl: RPC_URL,
        },
      ],
      defaultChainId: CHAIN_ID,
    })
  : null;

const connectors = ENABLE_CONTROLLER
  ? [cartridge_controller].filter(
      (connector): connector is ControllerConnector => connector !== null
    )
  : [];

export const availableConnectors: Connector[] = [
  ...connectors,
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
