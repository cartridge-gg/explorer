import type { Meta, StoryObj } from "@storybook/react-vite";
import { Network } from "./network";

const meta = {
  tags: ["autodocs"],
  title: "Network Button",
  component: Network,
} satisfies Meta<typeof Network>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
