import type { Meta, StoryObj } from "@storybook/react-vite";
import { Network } from "./network";
import { publicProvider, StarknetConfig } from "@starknet-react/core";
import { sepolia, mainnet, Chain, getSlotChain } from "@starknet-react/chains";
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
  defaultChainID,
  externalChains,
}: {
  children: React.ReactNode;
  defaultChainID: bigint;
  externalChains?: Chain[];
}) => {
  const defaultChains: Chain[] = [mainnet, sepolia];

  if (externalChains) {
    defaultChains.push(...externalChains);
  }

  return (
    <StarknetConfig
      chains={defaultChains}
      defaultChainId={defaultChainID}
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
      <StarknetProvider defaultChainID={currentChainID}>
        <Network />
      </StarknetProvider>
    );
  },
};

export const Mainnet: Story = {
  render: () => (
    <StarknetProvider defaultChainID={mainnet.id}>
      <Network />
    </StarknetProvider>
  ),
};

export const Sepolia: Story = {
  render: () => (
    <StarknetProvider defaultChainID={sepolia.id}>
      <Network />
    </StarknetProvider>
  ),
};

export const ShortSlotName: Story = {
  render: () => {
    const slotChain: Chain = getSlotChain(
      shortString.encodeShortString("WP_SLOT"),
    );

    return (
      <StarknetProvider
        externalChains={[slotChain]}
        defaultChainID={slotChain.id}
      >
        <Network />
      </StarknetProvider>
    );
  },
};

export const LongSlotName: Story = {
  render: () => {
    const slotChain: Chain = getSlotChain(
      shortString.encodeShortString("WP_JOKERSOFNEONALPHA"),
    );

    return (
      <StarknetProvider
        externalChains={[slotChain]}
        defaultChainID={slotChain.id}
      >
        <Network />
      </StarknetProvider>
    );
  },
};

export const Other: Story = {
  render: () => {
    const unknownChain: Chain = {
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
    return (
      <StarknetProvider
        externalChains={[unknownChain]}
        defaultChainID={unknownChain.id}
      >
        <Network />
      </StarknetProvider>
    );
  },
};
