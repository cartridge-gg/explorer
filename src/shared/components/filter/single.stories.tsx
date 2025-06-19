import type { Meta, StoryObj } from "@storybook/react-vite";
import { SingleFilterTransaction } from "./single-filter";

const meta: Meta<typeof SingleFilterTransaction> = {
  tags: ["autodocs"],
  title: "Filter/Single",
  component: SingleFilterTransaction,
  args: {
    value: "All",
    onValueChange: (value) => console.log(value),
    items: [
      { key: "INVOKE", value: "Invoke" },
      { key: "DEPLOY_ACCOUNT", value: "Deploy Account" },
      { key: "DECLARE", value: "Declare" },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
