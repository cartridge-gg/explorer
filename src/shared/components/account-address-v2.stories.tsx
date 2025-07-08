import type { Meta, StoryObj } from "@storybook/react-vite";
import { AccountAddressV2 } from "./account-address-v2";

const meta = {
  tags: ["autodocs"],
  title: "Account Address V2",
  component: AccountAddressV2,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof AccountAddressV2>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    address:
      "0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D",
  },
};
