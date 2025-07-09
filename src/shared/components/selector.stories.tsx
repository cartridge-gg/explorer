import type { Meta, StoryObj } from "@storybook/react-vite";
import { Selector } from "./Selector";
import { Tabs } from "@cartridge/ui";

const meta = {
  tags: ["autodocs"],
  title: "Selector",
  component: Selector,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Selector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { label: "Raw", value: "raw" },
      { label: "Decoded", value: "decoded" },
    ],
  },
  decorators: [
    (Story) => (
      <Tabs defaultValue="decoded" className="space-y-[15px]">
        <Story />
      </Tabs>
    ),
  ],
};

export const ThreeItems: Story = {
  args: {
    items: [
      { label: "Raw", value: "raw" },
      { label: "Decoded", value: "decoded" },
      { label: "Encoded", value: "encoded" },
    ],
  },
  decorators: [
    (Story) => (
      <Tabs defaultValue="decoded" className="space-y-[15px]">
        <Story />
      </Tabs>
    ),
  ],
};
