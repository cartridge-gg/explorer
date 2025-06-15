import type { Meta, StoryObj } from "@storybook/react-vite";
import { Hash } from "./hash";

const meta = {
  tags: ["autodocs"],
  title: "Hash",
  component: Hash,
} satisfies Meta<typeof Hash>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: "0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D",
  },
};

export const Skeleton: Story = {
  args: {
    value: undefined,
  },
};

export const ShortHash: Story = {
  args: {
    value: "0x1",
  },
};

export const Link: Story = {
  args: {
    value: "0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D",
    to: "../contract/0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D",
  },
};
