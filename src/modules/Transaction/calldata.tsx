import { CopyableInteger } from "@/shared/components/copyable-integer";
import {
  DialogClose,
  FnIcon,
  Input,
  Skeleton,
  Tabs,
  TabsContent,
  TimesIcon,
} from "@cartridge/ui";
import { FeltDisplayer } from "@/shared/components/felt-displayer";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/shared/components/dialog";
import { Badge } from "@/shared/components/badge";
import { useCalldata } from "./hooks";
import { GetTransactionResponse } from "starknet";
import { decodeCalldata } from "@/shared/utils/rpc";
import { useScreen } from "@/shared/hooks/useScreen";
import { CopyableText } from "@/shared/components/copyable-text";
import { Selector } from "@/shared/components/Selector";
import { Editor } from "@/shared/components/editor";
import { Felt } from "@starknet-io/types-js";

// Helper to check if array is a felt252 array (all elements are hex or decimal strings)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isFeltArray(arr: Array<any>): boolean {
  return arr.every((i) => typeof i === "bigint");
}

type DisplayInfo =
  | { type: "feltArray"; value: Array<Felt> }
  | { type: "complex"; value: string }
  | { type: "primitive"; value: string };

const isFeltArrayValue = (value: unknown): value is Array<Felt> =>
  Array.isArray(value) && isFeltArray(value);

const isComplexValue = (value: unknown): boolean => {
  const isArray = Array.isArray(value);
  const isObject = typeof value === "object" && value !== null && !isArray;
  return isObject || (isArray && !isFeltArray(value));
};

// Helper to determine display type and value
function getDisplayInfo(value: unknown): DisplayInfo {
  if (isFeltArrayValue(value)) {
    return { type: "feltArray", value };
  }

  if (isComplexValue(value)) {
    return {
      type: "complex",
      value: JSON.stringify(
        value,
        (_, v) => (typeof v === "bigint" ? `0x${v.toString(16)}` : v),
        2,
      ),
    };
  }

  // Handle primitive values (including null)
  return {
    type: "primitive",
    value: value?.toString() ?? "null",
  };
}

export function Calldata({ tx }: { tx: GetTransactionResponse }) {
  const { data: decoded } = useCalldata(decodeCalldata(tx));
  const { isMobile } = useScreen();

  return (
    <Tabs defaultValue="decoded" className="flex flex-col h-full">
      <div className="mb-[15px]">
        <Selector
          items={[
            { label: "Raw", value: "raw" },
            { label: "Decoded", value: "decoded" },
          ]}
        />
      </div>
      <TabsContent
        value="decoded"
        className="flex-1 space-y-px overflow-hidden"
      >
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
                <button
                  type="button"
                  className="h-[35px] w-full bg-background-200 hover:bg-background-300 px-[15px] py-[5.5px] first:rounded-t-sm last:rounded-b-sm flex items-center gap-4"
                >
                  <CopyableInteger
                    title="Contract address"
                    length={1}
                    value={c.contract}
                  />
                  <div className="flex items-center gap-2 text-foreground-200">
                    <FnIcon className="text-foreground-400" />
                    <span className="font-semibold">{c.function_name}</span>
                  </div>
                </button>
              </DialogTrigger>

              <DialogContent
                overlayClassName="bg-[#000000]/[0.7]"
                className="[&>button]:hidden w-full sm:max-w-[586px] max-h-[500px] rounded-[12px] sm:rounded-[12px] p-0 border gap-0 min-h-0"
              >
                <div className="sticky top-0 z-10 bg-background">
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
                      <CopyableInteger
                        title="Contract Address"
                        length={isMobile ? 1 : 3}
                        value={c.contract}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="capitalize text-foreground-400 text-[12px]/[16px] font-normal">
                        function
                      </p>
                      <CopyableText
                        value={c.function_name}
                        title="Function name"
                      />
                    </div>
                  </div>
                </div>

                <Tabs
                  defaultValue="decoded"
                  className="flex flex-col gap-[13px] p-[15px]"
                >
                  <Selector
                    containerClassName="self-start"
                    items={[
                      { value: "raw", label: "Raw" },
                      { value: "decoded", label: "Decoded" },
                    ]}
                  />
                  <TabsContent value="raw" className="mt-0">
                    <FeltDisplayer
                      value={c.raw_args}
                      className="max-h-[425px]"
                    />
                  </TabsContent>

                  <TabsContent
                    value="decoded"
                    className="flex flex-col gap-[10px] mt-0"
                  >
                    {c.data.map((input, i) => {
                      if (!input.name) {
                        return null;
                      }

                      const display = getDisplayInfo(input.value);

                      return (
                        <div key={i} className="flex flex-col gap-[10px]">
                          <div className="flex items-center gap-[7px]">
                            <p className="text-foreground-400 font-semibold text-[12px]">
                              {input.name}
                            </p>
                            <Badge className="px-[7px] py-[2px]">
                              <span className="text-[10px] font-semibold">
                                {input.type || "Unknown"}
                              </span>
                            </Badge>
                          </div>
                          {display.type === "feltArray" ? (
                            <FeltDisplayer
                              value={display.value as Felt[]}
                              className="w-full bg-input/50 border-none rounded-md"
                              height={115}
                            />
                          ) : display.type === "complex" ? (
                            <>
                              <div className="bg-input/50 rounded-md overflow-auto overflow-x-auto py-[7px] px-[10px] font-mono text-xs max-h-[115px] cursor-not-allowed">
                                <pre className="whitespace-pre break-words text-foreground-200 text-[11px] font-mono">
                                  {display.value}
                                </pre>
                              </div>
                              <Editor
                                defaultLanguage="json"
                                value={display.value as string}
                                options={{
                                  readOnly: true,
                                  minimap: { enabled: false },
                                  scrollBeyondLastLine: false,
                                  scrollbar: { alwaysConsumeMouseWheel: false },
                                  wordWrap: "on",
                                  lineNumbers: "off",
                                  fontSize: 11,
                                  padding: { top: 8, bottom: 8 },
                                }}
                                className="w-full"
                                height={115}
                              />
                            </>
                          ) : (
                            <Input
                              value={display.value}
                              disabled
                              className="bg-input focus-visible:bg-input border-none disabled:bg-input px-[10px] py-[7px]"
                            />
                          )}
                        </div>
                      );
                    })}
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          ))
        )}
      </TabsContent>

      <TabsContent value="raw" className="flex-1 mt-0">
        <FeltDisplayer
          height={isMobile ? "500px" : "100%"}
          value={tx.calldata}
          // value={Array.from({ length: 1000 }, (_, i) => i + 1)}
        />
      </TabsContent>
    </Tabs>
  );
}
