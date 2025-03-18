import { useCallback, useState, useEffect, useMemo } from "react";
import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { AbiEntry, CallData, FunctionAbi, hash } from "starknet";
import { Selector, SelectorItem } from "@/shared/components/Selector";
import { truncateString } from "@/shared/utils/string";
import {
  convertObjectValuesToDisplayValues,
  convertValue,
} from "@/shared/utils/rpc_utils";
import { ArrowRightIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const TxTypesTabs = ["Decoded", "Raw"] as const;
const ConvertValueTabs = ["decimal", "hex"] as const;

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

const ValueRenderer = ({
  value,
  type,
}: {
  value: string;
  type: "decimal" | "hex";
}) => {
  const displayValue = useMemo(
    () =>
      typeof value === "object"
        ? convertObjectValuesToDisplayValues(value, type)
        : convertValue(value)?.[type],
    [value, type]
  );

  return <pre>{JSON.stringify(displayValue, null, 2)}</pre>;
};

export default function CalldataDisplay({ calldata }: CalldataDisplayProps) {
  const queryClient = useQueryClient();
  const [decodedCalldata, setDecodedCalldata] = useState<DecodedCalldata[]>([]);

  const [selectedTab, setSelectedTab] = useState<(typeof TxTypesTabs)[number]>(
    TxTypesTabs[0]
  );
  const [expandedItem, setExpandedItem] = useState<string[]>([]);
  const [decodedRawMap, setDecodedRawMap] = useState<
    Record<string, (typeof TxTypesTabs)[number]>
  >({});
  const [convertValueTabMap, setConvertValueTabMap] = useState<
    Record<string, (typeof ConvertValueTabs)[number]>
  >({});

  const fetchAndDecodeCalldata = useCallback(async () => {
    if (!calldata || calldata.length === 0) return;

    const decodedPromises = calldata.map(async (data) => {
      try {
        // Fetch contract ABI using React Query's cache
        const contractData = await queryClient.fetchQuery({
          queryKey: ["contract-abi", data.contract],
          queryFn: () => RPC_PROVIDER.getClassAt(data.contract),
          staleTime: 1000 * 60 * 60, // 1 hour
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
        });

        const formattedParams = data.args;

        const myCallData = new CallData(abi);

        const { inputs } = myCallData.parser
          .getLegacyFormat()
          .find(
            (abiItem: AbiEntry) => abiItem.name === matchingFunction?.name
          ) as FunctionAbi;

        const inputsTypes = inputs.map((inp: { type: string }) => {
          return inp.type as string;
        });

        const decoded = myCallData.decodeParameters(
          inputsTypes,
          formattedParams
        );

        const formattedResponse: DecodedArg[] = [];

        if (Array.isArray(decoded)) {
          decoded.forEach((arg, index) => {
            formattedResponse.push({
              value: arg,
              name: inputs[index].name ?? "",
              type: inputs[index].type ?? "",
            });
          });
        }

        setDecodedRawMap((prev) => ({
          ...prev,
          [data.selector]: "Decoded",
        }));

        setConvertValueTabMap((prev) => ({
          ...prev,
          [data.selector]: "decimal",
        }));

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

  if (!calldata || calldata.length === 0) {
    return (
      <div className="text-center text-gray-500">No calldata available</div>
    );
  }

  return (
    <div className="space-y-2 pb-4 flex-none">
      <div className="sticky top-0 bg-white z-10 p-4">
        <Selector
          selected={selectedTab}
          onTabSelect={(value) =>
            setSelectedTab(value as (typeof TxTypesTabs)[number])
          }
          className="w-min rounded-sm bg-white z-10"
        >
          {TxTypesTabs.map((type) => (
            <SelectorItem
              key={type}
              name={type}
              value={type}
              className="w-max text-xs py-[2px]"
            />
          ))}
        </Selector>
      </div>

      {selectedTab === "Decoded" ? (
        <div className="flex flex-grow-0 flex-col px-4">
          <div className="flex flex-col border">
            {decodedCalldata.map((item) => (
              <div
                key={item.selector}
                className="cursor-pointer border-b last:border-b-0"
                onClick={() => {
                  setExpandedItem((prev) =>
                    prev.includes(item.selector)
                      ? prev.filter((s) => s !== item.selector)
                      : [...prev, item.selector]
                  );
                }}
              >
                <div className="px-4 flex flex-row items-center gap-2 py-2 cursor-pointer">
                  <span className="underline">
                    {truncateString(item.contract)}
                  </span>
                  <span>
                    <ArrowRightIcon className="w-3 h-3" />
                  </span>
                  <span className="font-bold">fn</span> {item.function_name}()
                </div>

                {expandedItem.includes(item.selector) ? (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="flex flex-grow-0 border-t cursor-default shadow-inner flex-col gap-1 bg-[#F1F1F1] p-2"
                  >
                    <div className="flex justify-between">
                      <Selector
                        selected={decodedRawMap[item.selector]}
                        onTabSelect={(value) =>
                          setDecodedRawMap((prev) => ({
                            ...prev,
                            [item.selector]:
                              value as (typeof TxTypesTabs)[number],
                          }))
                        }
                        className="w-min rounded-sm"
                      >
                        {TxTypesTabs.map((type) => (
                          <SelectorItem
                            key={type}
                            name={type}
                            value={type}
                            className="w-max text-xs py-[2px]"
                          />
                        ))}
                      </Selector>
                      <Selector
                        selected={convertValueTabMap[item.selector]}
                        onTabSelect={(value) =>
                          setConvertValueTabMap((prev) => ({
                            ...prev,
                            [item.selector]:
                              value as (typeof ConvertValueTabs)[number],
                          }))
                        }
                        className="w-min rounded-sm"
                      >
                        {ConvertValueTabs.map((type) => (
                          <SelectorItem
                            key={type}
                            name={type}
                            value={type}
                            className="w-max text-xs py-[2px]"
                          />
                        ))}
                      </Selector>
                    </div>

                    <p className="text-sm text-gray-500 pt-2">
                      ({item.params.map((arg) => arg).join(", ")})
                    </p>

                    <div className="bg-white border overflow-x-auto">
                      {decodedRawMap[item.selector] === "Decoded" ? (
                        <table className="w-full ">
                          <tbody>
                            {item.data.map((arg, rowIndex, array) => (
                              <tr
                                key={arg.name}
                                className={`${
                                  rowIndex !== array.length - 1
                                    ? "border-b"
                                    : ""
                                }`}
                              >
                                <td className="px-2 py-1 text-left w-1/4 ">
                                  <span className="font-bold">{arg.name}</span>
                                </td>
                                <td className="px-2 py-1 text-left w-1/4 ">
                                  <span className="text-gray-500">
                                    {arg.type}
                                  </span>
                                </td>
                                <td className="px-2 py-1 text-left w-2/4 overflow-x-auto">
                                  <ValueRenderer
                                    value={arg.value}
                                    type={convertValueTabMap[item.selector]}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <table className="w-full ">
                          <tbody>
                            {item.raw_args.map((arg, index, array) => (
                              <tr
                                key={index}
                                className={`${
                                  index !== array.length - 1 ? "border-b" : ""
                                }`}
                              >
                                <td className="px-2 py-1 text-left w-1/6 ">
                                  <span className="font-bold mr-4">
                                    {index + 1}
                                  </span>
                                </td>
                                <td className="px-2 py-1 text-left w-5/6 overflow-x-auto">
                                  {
                                    convertValue(arg)?.[
                                      convertValueTabMap[item.selector]
                                    ]
                                  }
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-4">
          <table className="w-full border">
            <tbody>
              {calldata.map((item) => {
                let current_count = 0;
                return item.args.map((arg, index, array) => {
                  current_count++;
                  return (
                    <tr
                      key={current_count}
                      className={`${
                        index !== array.length - 1 ? "border-b" : ""
                      }`}
                    >
                      <td className="px-4 py-2 text-left">
                        <span className="font-bold mr-4">{current_count}</span>{" "}
                        {arg}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
