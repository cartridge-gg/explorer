"use client";
import React from "react";
import { sepolia, mainnet, Chain } from "@starknet-react/chains";
import { StarknetConfig, jsonRpcProvider } from "@starknet-react/core";
import { Connector, InjectedConnector } from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import { WebWalletConnector } from "starknetkit/webwallet";
import {
  CHAIN_ID,
  CHAIN_NETWORK,
  CHAIN_NAME,
  RPC_URL,
  IS_EMBEDDED,
} from "@/constants/rpc";

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

export const katanaLocalChain = {
  id: CHAIN_ID,
  network: CHAIN_NETWORK,
  name: CHAIN_NAME,
  nativeCurrency: {
    address:
      "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },

  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
    public: {
      http: [RPC_URL],
    },
  },
} as const satisfies Chain;

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  const providers = jsonRpcProvider({
    rpc: () => ({
      nodeUrl: RPC_URL,
    }),
  });

  return (
    <StarknetConfig
      chains={[
        IS_EMBEDDED === "true"
          ? import.meta.env.VITE_IS_TESTNET === "true"
            ? sepolia
            : mainnet
          : katanaLocalChain,
      ]}
      provider={providers}
      connectors={availableConnectors}
    >
      {children}
    </StarknetConfig>
  );
}
