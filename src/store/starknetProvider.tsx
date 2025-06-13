"use client";
import React from "react";
import { sepolia, mainnet } from "@starknet-react/chains";
import {
  StarknetConfig,
  jsonRpcProvider,
  useInjectedConnectors,
} from "@starknet-react/core";
import { constants } from "starknet";
import ControllerConnector from "@cartridge/connector/controller";
import { rpcUrl, CHAIN_ID } from "@/services/rpc";

const controllerConnector = new ControllerConnector({
  chains: [
    {
      rpcUrl: rpcUrl(),
    },
  ],
  defaultChainId: CHAIN_ID,
  url: import.meta.env.VITE_KEYCHAIN_URL,
});

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  const providers = jsonRpcProvider({
    rpc: () => ({
      nodeUrl: import.meta.env.VITE_RPC_URL as string,
    }),
  });

  const { connectors } = useInjectedConnectors({
    recommended: [controllerConnector],
  });

  return (
    <StarknetConfig
      chains={[
        import.meta.env.VITE_CHAIN_ID === constants.StarknetChainId.SN_MAIN
          ? mainnet
          : sepolia,
      ]}
      provider={providers}
      connectors={connectors}
    >
      {children}
    </StarknetConfig>
  );
}
