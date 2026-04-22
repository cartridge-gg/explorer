import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "./skeleton";

const meta = {
  tags: ["autodocs"],
  title: "UI/Skeleton",
  component: Skeleton,
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Line: Story = {
  args: { className: "h-4 w-60" },
};

export const Block: Story = {
  args: { className: "h-20 w-60" },
};

export const Circle: Story = {
  args: { className: "h-10 w-10 rounded-full" },
};
