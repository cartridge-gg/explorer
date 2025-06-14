import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchBar } from "@/shared/components/search-bar";

const meta = {
  tags: ["autodocs"],
  title: "Search Bar",
  component: SearchBar,
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
