import { Hash } from "@/shared/components/hash";
import {
  CopyIcon,
  DialogClose,
  FnIcon,
  Input,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TimesIcon,
} from "@cartridge/ui";
import { Editor } from "@/shared/components/editor";
import {
  Dialog,
  DialogContent,
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
      <TabsList className="h-auto rounded-sm p-[2px]">
        <TabsTrigger value="raw" className="py-[2px] px-[8px] rounded-sm">
          <span className="text-[12px]/[16px] font-medium">Raw</span>
        </TabsTrigger>
        <TabsTrigger value="decoded" className="py-[2px] px-[8px] rounded-sm">
          <span className="text-[12px]/[16px] font-medium">Decoded</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="decoded" className="mt-[15px]">
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
                  <Hash value={c.contract} />
                  <div className="flex items-center gap-2 text-foreground-200">
                    <FnIcon className="text-foreground-400" />
                    <span className="font-semibold">{c.function_name}</span>
                  </div>
                </div>
              </DialogTrigger>

              <DialogContent className="[&>button]:hidden min-w-[586px] rounded-[12px] p-0 border gap-0 min-h-0">
                <div className="flex items-center justify-between px-[15px] border-b border-background-200 h-[32px]">
                  <h1 className="text-[12px]/[16px] font-normal capitalize">
                    function calldata overview
                  </h1>
                  <DialogClose asChild>
                    <button className="text-foreground-400 hover:text-foreground-300">
                      <TimesIcon className="w-[15px] h-[15px]" />
                    </button>
                  </DialogClose>
                </div>

                <div className="flex flex-col gap-[10px] p-[15px] border-b border-background-200">
                  <div className="flex items-center justify-between gap-2">
                    <p className="capitalize text-foreground-400 text-[12px]/[16px] font-normal">
                      contract
                    </p>
                    <Hash value={c.contract} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="capitalize text-foreground-400 text-[12px]/[16px] font-normal">
                      function
                    </p>
                    <div
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => {
                        navigator.clipboard.writeText(c.function_name);
                        toast.success("Function name copied to clipboard");
                      }}
                    >
                      <span className="text-foreground-100 group-hover:text-foreground-200">
                        {c.function_name}
                      </span>
                      <CopyIcon size="sm" className="text-foreground-400" />
                    </div>
                  </div>
                </div>

                <Tabs
                  defaultValue="decoded"
                  className="flex flex-col gap-[13px] p-[15px]"
                >
                  <TabsList className="self-start h-auto rounded-sm p-[2px]">
                    <TabsTrigger
                      value="raw"
                      className="py-[2px] px-[8px] rounded-sm"
                    >
                      <span className="text-[12px]/[16px] font-medium">
                        Raw
                      </span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="decoded"
                      className="py-[2px] px-[8px] rounded-sm"
                    >
                      <span className="text-[12px]/[16px] font-medium">
                        Decoded
                      </span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="decoded"
                    className="flex flex-col gap-[10px] mt-0"
                  >
                    {c.data.map((input, i) => (
                      <div key={i} className="flex flex-col gap-[10px]">
                        <div className="flex items-center gap-[7px]">
                          <p className="text-foreground-400 font-semibold text-[12px]">
                            {input.name}
                          </p>
                          <Badge className="px-[7px] py-[2px] lowercase">
                            <span className="text-[10px] font-semibold">
                              {input.type}
                            </span>
                          </Badge>
                        </div>
                        <Input
                          value={input.value.toString()}
                          disabled
                          className="bg-input focus-visible:bg-input border-none disabled:bg-input px-[10px] py-[7px]"
                        />
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
