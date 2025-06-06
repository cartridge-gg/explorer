import type { Meta, StoryObj } from "@storybook/react-vite";
import { Network } from "./network";
import { publicProvider, StarknetConfig } from "@starknet-react/core";
import { sepolia, mainnet, Chain } from "@starknet-react/chains";
import { constants, num, shortString } from "starknet";
import { STRK_CONTRACT_ADDRESS } from "@cartridge/utils";

const meta = {
  tags: ["autodocs"],
  title: "Network Button",
  component: Network,
} satisfies Meta<typeof Network>;

// minimal setup for starknet provider to simulate different networks
const StarknetProvider = ({
  children,
  chainID,
}: {
  children: React.ReactNode;
  chainID: bigint;
}) => {
  const slotChain: Chain = {
    id: num.toBigInt(shortString.encodeShortString("WP_SLOT")),
    network: "Slot",
    name: "Slot",
    rpcUrls: {
      default: {
        http: ["https://api.cartridge.gg/x/slot/katana"],
      },
      public: {
        http: ["https://api.cartridge.gg/x/slot/katana"],
      },
    },
    nativeCurrency: {
      name: "Starknet",
      symbol: "STRK",
      decimals: 18,
      address: STRK_CONTRACT_ADDRESS as `0x${string}`,
    },
  };

  const localChain: Chain = {
    id: num.toBigInt(shortString.encodeShortString("LOCALHOST")),
    network: "localhost",
    name: "Localhost",
    rpcUrls: {
      default: {
        http: ["http://localhost:8001/x/slot/katana"],
      },
      public: {
        http: ["http://localhost:8001/x/slot/katana"],
      },
    },
    nativeCurrency: {
      name: "Starknet",
      symbol: "STRK",
      decimals: 18,
      address: STRK_CONTRACT_ADDRESS as `0x${string}`,
    },
  };

  const starknetConfigChains = [mainnet, sepolia, slotChain, localChain];

  return (
    <StarknetConfig
      chains={starknetConfigChains}
      defaultChainId={chainID}
      provider={publicProvider()}
    >
      {children}
    </StarknetConfig>
  );
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const currentChainID =
      import.meta.env.VITE_CHAIN_ID === constants.StarknetChainId.SN_MAIN
        ? mainnet.id
        : sepolia.id;
    return (
      <StarknetProvider chainID={currentChainID}>
        <Network />
      </StarknetProvider>
    );
  },
};

export const Mainnet: Story = {
  render: () => (
    <StarknetProvider chainID={mainnet.id}>
      <Network />
    </StarknetProvider>
  ),
};

export const Sepolia: Story = {
  render: () => (
    <StarknetProvider chainID={sepolia.id}>
      <Network />
    </StarknetProvider>
  ),
};

export const Slot: Story = {
  render: () => (
    <StarknetProvider
      chainID={num.toBigInt(shortString.encodeShortString("WP_SLOT"))}
    >
      <Network />
    </StarknetProvider>
  ),
};

export const Localhost: Story = {
  render: () => (
    <StarknetProvider
      chainID={num.toBigInt(shortString.encodeShortString("LOCALHOST"))}
    >
      <Network />
    </StarknetProvider>
  ),
};
