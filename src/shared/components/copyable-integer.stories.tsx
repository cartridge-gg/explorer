import type { Meta, StoryObj } from "@storybook/react-vite";
import { CopyableInteger } from "./copyable-integer";

const meta = {
  tags: ["autodocs"],
  title: "Copyable/Copyable Integer",
  component: CopyableInteger,
} satisfies Meta<typeof CopyableInteger>;

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

export const CustomLength2: Story = {
  args: {
    value: "0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D",
    length: 2,
  },
};

export const CustomLength3: Story = {
  args: {
    value: "0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D",
    length: 3,
  },
};

export const Link: Story = {
  args: {
    value: "0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D",
    to: "../contract/0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D",
  },
};
