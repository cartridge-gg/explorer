import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input";

const meta = {
  tags: ["autodocs"],
  title: "UI/Input",
  component: Input,
  args: {
    placeholder: "Search...",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Large: Story = {
  args: { size: "lg" },
};

export const Username: Story = {
  args: { variant: "username", placeholder: "username" },
};

export const WithValueAndClear: Story = {
  args: {
    value: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    onClear: () => {},
  },
};

export const Loading: Story = {
  args: {
    value: "loading…",
    isLoading: true,
    onClear: () => {},
  },
};

export const Error: Story = {
  args: {
    value: "bad input",
    error: new Error("Invalid address"),
  },
};

export const Disabled: Story = {
  args: { disabled: true, placeholder: "disabled" },
};
