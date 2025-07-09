import type { Meta, StoryObj } from "@storybook/react-vite";
import { CopyableText } from "./copyable-text";

const meta = {
  tags: ["autodocs"],
  title: "Copyable/Copyable Text",
  component: CopyableText,
} satisfies Meta<typeof CopyableText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: "openzeppelin_account::interface::AccountABI",
  },
};

export const CustomTitle: Story = {
  args: {
    title: "Account ABI",
    value: "openzeppelin_account::interface::AccountABI",
  },
};

export const Skeleton: Story = {
  args: {
    value: undefined,
  },
};
