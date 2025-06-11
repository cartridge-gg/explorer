import { useCallback, useState, useEffect } from "react";
import { QUERY_KEYS, RPC_PROVIDER } from "@/services/starknet_provider_config";
import { AbiEntry, CallData, FunctionAbi, hash } from "starknet";
import { useQueryClient } from "@tanstack/react-query";
import { STALE_TIME } from "@/constants/rpc";
import { CACHE_TIME } from "@/constants/rpc";
import { Hash } from "@/shared/components/hash";
import {
  CopyIcon,
  FnIcon,
  Input,
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

interface CalldataDisplayProps {
  calldata: {
    contract: string;
    selector: string;
    args: string[];
  }[];
}

interface DecodedArg {
  name: string;
  type: string;
  value: string;
}

interface DecodedCalldata {
  contract: string;
  function_name: string;
  selector: string;
  params: string[];
  raw_args: string[];
  data: DecodedArg[];
}

interface AbiItem {
  type: string;
  name?: string;
  inputs?: Array<{ name: string; type: string }>;
  selector?: string;
  items?: AbiItem[];
  state_mutability?: string;
  members?: Array<{ name: string; type: string; offset: number }>;
}

export function Calldata({ calldata }: CalldataDisplayProps) {
  const queryClient = useQueryClient();
  const [decodedCalldata, setDecodedCalldata] = useState<DecodedCalldata[]>([]);

  const fetchAndDecodeCalldata = useCallback(async () => {
    if (!calldata || calldata.length === 0) return;

    const decodedPromises = calldata.map(async (data) => {
      try {
        // Fetch contract ABI using React Query's cache
        const contractData = await queryClient.fetchQuery({
          queryKey: [QUERY_KEYS.getClassAt, data.contract],
          queryFn: () => RPC_PROVIDER.getClassAt(data.contract),
          staleTime: STALE_TIME,
          gcTime: CACHE_TIME,
        });

        const abi = contractData.abi;

        // Find the function that matches the selector
        let matchingFunction: AbiItem | undefined;

        // First check interfaces
        abi.forEach((item: AbiItem) => {
          if (item.type === "function") {
            const funcNameSelector = hash.getSelectorFromName(item.name || "");
            if (funcNameSelector === data.selector) {
              matchingFunction = item;
            }
          }

          if (item.type === "interface") {
            item.items?.forEach((func: AbiItem) => {
              if (func.type === "function") {
                const funcNameSelector = hash.getSelectorFromName(
                  func.name || "",
                );
                if (funcNameSelector === data.selector) {
                  matchingFunction = func;
                }
              }
            });
          }
        });

        const formattedParams = data.args;

        const myCallData = new CallData(abi);

        const { inputs } = myCallData.parser
          .getLegacyFormat()
          .find(
            (abiItem: AbiEntry) => abiItem.name === matchingFunction?.name,
          ) as FunctionAbi;

        const inputsTypes = inputs.map((inp: { type: string }) => {
          return inp.type as string;
        });

        const decoded = myCallData.decodeParameters(
          inputsTypes,
          formattedParams,
        );

        const formattedResponse: DecodedArg[] = [];

        if (Array.isArray(decoded)) {
          if (inputs.length === 1) {
            formattedResponse.push({
              value: decoded,
              name: inputs[0]?.name,
              type: inputs[0]?.type,
            });
          } else {
            decoded.forEach((arg, index) => {
              formattedResponse.push({
                value: arg,
                name: inputs[index]?.name,
                type: inputs[index]?.type,
              });
            });
          }
        }

        return {
          contract: data.contract,
          function_name: matchingFunction?.name || "",
          selector: data.selector,
          data: formattedResponse,
          params: inputs.map((inp) => inp?.name),
          raw_args: data.args,
        };
      } catch (error) {
        console.error("Error decoding calldata:", error);
        return {
          contract: data.contract,
          function_name: "Error",
          selector: data.selector,
          params: [],
          raw_args: data.args,
          data: data.args.map((arg, index) => ({
            name: `arg${index}`,
            type: "unknown",
            value: arg,
          })),
        };
      }
    });

    const decoded = await Promise.all(decodedPromises);

    setDecodedCalldata(decoded as DecodedCalldata[]);
  }, [calldata, queryClient]);

  useEffect(() => {
    fetchAndDecodeCalldata();
  }, [fetchAndDecodeCalldata]);

  return (
    <Tabs defaultValue="decoded">
      <TabsList>
        <TabsTrigger value="decoded">Decoded</TabsTrigger>
        <TabsTrigger value="raw">Raw</TabsTrigger>
      </TabsList>

      <TabsContent value="decoded">
        {decodedCalldata.map((c, i) => (
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
        ))}
      </TabsContent>

      <TabsContent value="raw">
        <Editor
          className="min-h-[80vh]"
          defaultLanguage="json"
          value={JSON.stringify(
            calldata.flatMap((calldata) => calldata.args),
            null,
            2,
          )}
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
