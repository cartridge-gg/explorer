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
import { getRpcUrl, getChainId } from "@/services/rpc";
import { useQuery } from "@tanstack/react-query";

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  const rpcUrl = getRpcUrl();
  const { data, error } = useQuery({
    queryKey: ["chainId", rpcUrl],
    queryFn: async () => {
      const chainId = await getChainId();
      const controllerConnector = new ControllerConnector({
        chains: [{ rpcUrl }],
        defaultChainId: chainId,
        url: import.meta.env.VITE_KEYCHAIN_URL,
      });
      return { chainId, controllerConnector };
    },
    staleTime: Infinity, // Chain ID doesn't change
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const { connectors } = useInjectedConnectors({
    recommended: data?.controllerConnector ? [data.controllerConnector] : [],
  });

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        Error loading Starknet provider
      </div>
    );
  }

  return (
    <StarknetConfig
      chains={[
        data?.chainId === constants.StarknetChainId.SN_MAIN ? mainnet : sepolia,
      ]}
      provider={jsonRpcProvider({
        rpc: () => ({ nodeUrl: rpcUrl }),
      })}
      connectors={connectors}
    >
      {children}
    </StarknetConfig>
  );
}
