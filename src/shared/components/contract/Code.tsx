import {
  TabsTrigger,
  TabsList,
  TabsContent,
  CodeIcon,
  CardHeaderRight,
  Button,
  CopyIcon,
} from "@cartridge/ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/shared/components/card";
import { Editor } from "@/shared/components/editor";
import { useCallback, useState } from "react";
import { Tabs } from "../tabs";
import { CardSeparator } from "../card";
import { toast } from "sonner";

export type CodeProps = {
  abi?: string;
  sierra?: string;
};

export function CodeCard({ abi, sierra }: CodeProps) {
  const [selected, setSelected] = useState("abi");

  const onCopy = useCallback(() => {
    const code = selected === "abi" ? abi : sierra;
    if (!code) return;
    navigator.clipboard.writeText(code);
    toast.success("Copied to clipboard");
  }, [abi, sierra, selected]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CodeIcon variant="solid" />
          <div>Code</div>
        </CardTitle>
        <CardHeaderRight></CardHeaderRight>
      </CardHeader>
      <CardSeparator className="mb-0" />
      <CardContent>
        <Tabs defaultValue="abi" onValueChange={setSelected}>
          {sierra && (
            <div className="flex items-center justify-between">
              <TabsList className="self-start">
                <TabsTrigger value="abi">Contract ABI</TabsTrigger>
                <TabsTrigger value="sierra">Sierra Bytecode</TabsTrigger>
              </TabsList>
              <Button variant="secondary" size="icon" onClick={onCopy}>
                <CopyIcon size="sm" />
              </Button>
            </div>
          )}
          <TabsContent value="abi">
            <Editor
              className="min-h-[80vh]"
              defaultLanguage="json"
              value={abi}
              options={{
                readOnly: true,
                scrollbar: {
                  alwaysConsumeMouseWheel: false,
                },
              }}
            />
          </TabsContent>
          {sierra && (
            <TabsContent value="sierra">
              <Editor
                className="min-h-[80vh]"
                defaultLanguage="json"
                value={sierra}
                options={{
                  readOnly: true,
                  scrollbar: {
                    alwaysConsumeMouseWheel: false,
                  },
                }}
              />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
