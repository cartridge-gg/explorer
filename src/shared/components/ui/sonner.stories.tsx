import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import { Toaster } from "./sonner";
import { Button } from "./button";

const meta = {
  tags: ["autodocs"],
  title: "UI/Toaster",
  component: Toaster,
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <>
      <Button variant="secondary" onClick={() => toast.success("Saved!")}>
        Fire toast
      </Button>
      <Toaster />
    </>
  ),
};
