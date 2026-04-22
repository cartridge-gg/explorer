import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Card,
  CardContent,
  CardHeader,
  CardLabel,
  CardSeparator,
  CardTitle,
} from "./card";

const meta = {
  tags: ["autodocs"],
  title: "UI/Card",
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-72">
      <CardHeader>
        <CardTitle>Block</CardTitle>
      </CardHeader>
      <CardSeparator />
      <CardContent>
        <CardLabel>number</CardLabel>
        <div className="font-mono">100</div>
      </CardContent>
    </Card>
  ),
};
