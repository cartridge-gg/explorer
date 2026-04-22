import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";

const meta = {
  tags: ["autodocs"],
  title: "UI/Button",
  component: Button,
  args: {
    children: "Button",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: "primary" },
};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

export const Tertiary: Story = {
  args: { variant: "tertiary" },
};

export const Icon: Story = {
  args: { variant: "icon", size: "icon", children: "·" },
};

export const Link: Story = {
  args: { variant: "link" },
};

export const Destructive: Story = {
  args: { variant: "destructive" },
};

export const Outline: Story = {
  args: { variant: "outline" },
};

export const Ghost: Story = {
  args: { variant: "ghost" },
};

export const Loading: Story = {
  args: { variant: "primary", isLoading: true },
};

export const Active: Story = {
  args: { variant: "secondary", isActive: true },
};

export const Disabled: Story = {
  args: { variant: "primary", disabled: true },
};
