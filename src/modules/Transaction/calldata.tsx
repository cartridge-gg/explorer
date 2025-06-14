import { Hash } from "@/shared/components/hash";
import {
  CopyIcon,
  FnIcon,
  Input,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@cartridge/ui";
import { Editor } from "@/shared/components/editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/dialog";
import { toast } from "sonner";
import { Badge } from "@/shared/components/badge";
import { useCalldata } from "./hooks";
import { GetTransactionResponse } from "starknet";
import { decodeCalldata } from "@/shared/utils/rpc";

export function Calldata({ tx }: { tx: GetTransactionResponse }) {
  const { data: decoded } = useCalldata(decodeCalldata(tx));

  return (
    <Tabs defaultValue="decoded">
      <TabsList>
        <TabsTrigger value="decoded">Decoded</TabsTrigger>
        <TabsTrigger value="raw">Raw</TabsTrigger>
      </TabsList>

      <TabsContent value="decoded">
        {!tx ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </>
        ) : !decoded ? (
          <div className="w-full h-[10vh] flex items-center justify-center">
            Unknown calldata
          </div>
        ) : (
          decoded.map((c, i) => (
            <Dialog key={i}>
              <DialogTrigger asChild>
                <div className="w-full bg-background-200 p-2 first:rounded-t last:rounded-b flex items-center gap-4">
                  <Hash value={c.contract} to={`../contract/${c.contract}`} />
                  <div className="flex items-center gap-2 text-foreground-200">
                    <FnIcon className="text-foreground-400" />
                    <span className="font-semibold">{c.function_name}</span>
                    <span>({c.params.map((arg) => arg).join(", ")})</span>
                  </div>
                </div>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>function calldata overview</DialogTitle>
                </DialogHeader>

                <div className="flex items-center justify-between gap-2">
                  <div className="capitalize text-foreground-400 text-sm">
                    contract
                  </div>
                  <Hash value={c.contract} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="capitalize text-foreground-400 text-sm">
                    function
                  </div>
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                    onClick={() => {
                      navigator.clipboard.writeText(c.function_name);
                      toast.success("Function name copied to clipboard");
                    }}
                  >
                    <span>{c.function_name}</span>
                    <CopyIcon size="sm" className="text-foreground-400" />
                  </div>
                </div>

                <Tabs defaultValue="decoded" className="flex flex-col gap-4">
                  <TabsList className="self-start">
                    <TabsTrigger value="decoded">Decoded</TabsTrigger>
                    <TabsTrigger value="raw">Raw</TabsTrigger>
                  </TabsList>

                  <TabsContent value="decoded" className="flex flex-col gap-4">
                    {c.data.map((input, i) => (
                      <div key={i} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="text-foreground-400 font-semibold">
                            {input.name}
                          </div>
                          <Badge className="lowercase">{input.type}</Badge>
                        </div>
                        <Input value={input.value.toString()} disabled />
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="raw">
                    <Editor
                      className="min-h-[300px]"
                      defaultLanguage="json"
                      value={JSON.stringify(c.raw_args, null, 2)}
                      options={{
                        readOnly: true,
                        scrollbar: {
                          alwaysConsumeMouseWheel: false,
                        },
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          ))
        )}
      </TabsContent>

      <TabsContent value="raw">
        <Editor
          className="min-h-[80vh]"
          defaultLanguage="json"
          value={JSON.stringify(tx.calldata, null, 2)}
          options={{
            readOnly: true,
            scrollbar: {
              alwaysConsumeMouseWheel: false,
            },
          }}
        />
      </TabsContent>
    </Tabs>
  );
}
