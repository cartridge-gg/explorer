import type { Meta, StoryObj } from "@storybook/react-vite";
import { MultiFilter } from "./multiple-filter";
import { useState } from "react";

const meta: Meta<typeof MultiFilter> = {
  tags: ["autodocs"],
  title: "Filter/Multiple",
  component: MultiFilter,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>([]);
    const items = [
      { key: "INVOKE", value: "Invoke" },
      { key: "DEPLOY_ACCOUNT", value: "Deploy Account" },
      { key: "DECLARE", value: "Declare" },
    ];

    return <MultiFilter value={value} onValueChange={setValue} items={items} />;
  },
};
