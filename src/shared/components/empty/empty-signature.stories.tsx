import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptySignature } from "./empty-signature";

const meta = {
  tags: ["autodocs"],
  title: "Empty States/Signature",
  component: EmptySignature,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof EmptySignature>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
