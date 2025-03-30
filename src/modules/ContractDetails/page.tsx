import { useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import { truncateString } from "@/shared/utils/string";
import { useCallback, useEffect, useState } from "react";
import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { Contract } from "starknet";
import { convertValue } from "@/shared/utils/rpc_utils";
import { FunctionResult, DisplayFormatTypes } from "@/types/types";
import { useAccount, useDisconnect } from "@starknet-react/core";
import WalletConnectModal from "@/shared/components/wallet_connect";
import { BreadcrumbPage } from "@cartridge/ui-next";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbSeparator,
} from "@/shared/components/breadcrumbs";

import DetailsPageSelector from "@/shared/components/DetailsPageSelector";
import PageHeader from "@/shared/components/PageHeader";
import { SectionBox } from "@/shared/components/section/SectionBox";
import { SectionBoxEntry } from "@/shared/components/section";
import useBalances from "@/shared/hooks/useBalances";

const DataTabs = ["Read Contract", "Write Contract"];

interface FunctionInput {
  name: string;
  type: string;
  value: string;
}

const DisplayFormat = ["decimal", "hex", "string"];

export default function ContractDetails() {
  const { disconnect } = useDisconnect();
  const { address, account, status } = useAccount();

  const { contractAddress } = useParams<{
    contractAddress: string;
  }>();
  const { isMobile } = useScreen();
  const [classHash, setClassHash] = useState<string | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [readFunctions, setReadFunctions] = useState<
    {
      name: string;
      inputs: { name: string; type: string }[];
      selector: string;
    }[]
  >([]);

  const [selectedDataTab, setSelectedDataTab] = useState(DataTabs[0]);

  const [writeFunctions, setWriteFunctions] = useState<
    {
      name: string;
      inputs: { name: string; type: string }[];
      selector: string;
    }[]
  >([]);

  const [expandedFunctions, setExpandedFunctions] = useState<
    Record<string, FunctionInput[]>
  >({});

  const [functionResults, setFunctionResults] = useState<
    Record<string, FunctionResult<any>>
  >({});

  const [displayFormats, setDisplayFormats] = useState<
    Record<string, DisplayFormatTypes>
  >({});

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const fetchContractDetails = useCallback(async () => {
    if (!contractAddress) return;

    // get class hash
    const classHash = await RPC_PROVIDER.getClassHashAt(contractAddress);
    setClassHash(classHash);

    // process contract functions
    const contractClass = await RPC_PROVIDER.getClassAt(contractAddress);

    const readFuncs: typeof readFunctions = [];
    const writeFuncs: typeof writeFunctions = [];

    contractClass.abi.forEach((item) => {
      if (item.type === "interface") {
        item.items.forEach((func) => {
          if (func.type === "function") {
            const funcData = {
              name: func.name,
              inputs: func.inputs.map((input) => ({
                name: input.name,
                type: input.type,
              })),
              selector: func.selector || "",
            };

            if (
              func.state_mutability === "view" ||
              func.state_mutability === "pure"
            ) {
              readFuncs.push(funcData);
            } else {
              writeFuncs.push(funcData);
            }
          }
        });
      }
    });

    setReadFunctions(readFuncs);
    setWriteFunctions(writeFuncs);

    const contract = new Contract(
      contractClass.abi,
      contractAddress,
      RPC_PROVIDER
    );
    setContract(contract);
  }, [contractAddress]);

  useEffect(() => {
    if (!contractAddress) return;
    fetchContractDetails();
  }, [contractAddress, fetchContractDetails]);

  const handleInputChange = (
    functionName: string,
    inputIndex: number,
    value: string
  ) => {
    setExpandedFunctions((prev) => {
      const functionInputs = [...(prev[functionName] || [])];
      functionInputs[inputIndex] = {
        ...functionInputs[inputIndex],
        value: value,
      };
      return {
        ...prev,
        [functionName]: functionInputs,
      };
    });
  };

  const handleFunctionCall = async (functionName: string) => {
    if (!contract) return;

    // Set loading state
    setFunctionResults((prev) => ({
      ...prev,
      [functionName]: {
        loading: true,
        error: null,
        data: null,
      },
    }));

    try {
      const inputs =
        expandedFunctions[functionName]?.map((input) => input.value) || [];
      const result = await contract.call(functionName, inputs);

      // Update with success result
      setFunctionResults((prev) => ({
        ...prev,
        [functionName]: {
          loading: false,
          error: null,
          data: result,
        },
      }));
    } catch (error) {
      // Update with error
      setFunctionResults((prev) => ({
        ...prev,
        [functionName]: {
          loading: false,
          error: error instanceof Error ? error.message : "An error occurred",
          data: null,
        },
      }));
    }
  };

  const handleWriteFunctionCall = async (functionName: string) => {
    if (!contract || !account) {
      setFunctionResults((prev) => ({
        ...prev,
        [functionName]: {
          loading: false,
          error: "Please connect your wallet first",
          data: null,
        },
      }));
      return;
    }

    setFunctionResults((prev) => ({
      ...prev,
      [functionName]: {
        loading: true,
        error: null,
        data: null,
      },
    }));

    try {
      const inputs =
        expandedFunctions[functionName]?.map((input) => input.value) || [];

      // Execute the transaction using account
      const result = await account.execute([
        {
          contractAddress: contract.address,
          entrypoint: functionName,
          calldata: inputs,
        },
      ]);

      setFunctionResults((prev) => ({
        ...prev,
        [functionName]: {
          loading: false,
          error: null,
          data: result,
        },
      }));
    } catch (error) {
      setFunctionResults((prev) => ({
        ...prev,
        [functionName]: {
          loading: false,
          error: error instanceof Error ? error.message : "An error occurred",
          data: null,
        },
      }));
    }
  };

  const handleFormatChange = (
    functionName: string,
    format: DisplayFormatTypes
  ) => {
    setDisplayFormats((prev) => ({
      ...prev,
      [functionName]: format,
    }));
  };

  const { balances, isStrkLoading, isEthLoading } =
    useBalances(contractAddress);

  return (
    <>
      <div className="w-full flex-grow gap-8">
        <div className="mb-2">
          <Breadcrumb>
            <BreadcrumbItem href="/">Explorer</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem href="/">Contracts</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className=" text-sm">
                {isMobile && contractAddress
                  ? truncateString(contractAddress)
                  : contractAddress}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </Breadcrumb>
        </div>

        <PageHeader className="mb-6" title="Contract" />

        <div className="flex flex-col sl:flex-row sl:h-[70vh] gap-4">
          {/* Contract Info Section */}
          <div className="sl:w-[468px] min-w-[468px] flex flex-col gap-[6px] sl:overflow-y-scroll">
            <SectionBox>
              <SectionBoxEntry title="Address">
                {isMobile && contractAddress
                  ? truncateString(contractAddress)
                  : contractAddress}
              </SectionBoxEntry>

              <SectionBoxEntry title="Class Hash">
                {isMobile && classHash ? truncateString(classHash) : classHash}
              </SectionBoxEntry>
            </SectionBox>

            <SectionBox title="Balances">
              <table className="w-full">
                <tbody>
                  <tr>
                    <th className="text-left w-[53px] bg-white font-bold">
                      STRK
                    </th>
                    <td className="text-left">
                      {isStrkLoading
                        ? "0.00"
                        : balances.strk !== undefined
                        ? (Number(balances.strk) / 10 ** 18).toString()
                        : "N/A"}
                    </td>
                  </tr>

                  <tr>
                    <th className="text-left bg-white font-bold">ETH</th>
                    <td className="text-left">
                      {isEthLoading
                        ? "0.00"
                        : balances.eth !== undefined
                        ? (Number(balances.eth) / 10 ** 18).toString()
                        : "N/A"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </SectionBox>
          </div>

          <div className="h-full flex-grow grid grid-rows-[min-content_1fr]">
            <DetailsPageSelector
              selected={DataTabs[0]}
              onTabSelect={setSelectedDataTab}
              items={DataTabs.map((tab) => ({
                name: tab,
                value: tab,
              }))}
            />

            <div className="bg-white flex flex-col gap-3 mt-[6px] px-[15px] py-[17px] border border-borderGray overflow-auto">
              <div className="w-full h-full overflow-auto">
                {selectedDataTab === "Read Contract" ? (
                  <div className="h-full grid grid-flow-row mt-[1px] ">
                    {readFunctions.map((func, index) => (
                      <div
                        key={index}
                        className="mt-[-1px] flex flex-col p-4 border border-borderGray"
                      >
                        <div
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() => {
                            if (!expandedFunctions[func.name]) {
                              setExpandedFunctions((prev) => ({
                                ...prev,
                                [func.name]: func.inputs.map((input) => ({
                                  name: input.name,
                                  type: input.type,
                                  value: "",
                                })),
                              }));
                            } else {
                              setExpandedFunctions((prev) => {
                                const newState = { ...prev };
                                delete newState[func.name];
                                return newState;
                              });
                            }
                          }}
                        >
                          <div className="flex flex-row gap-2 w-full flex-wrap">
                            <p className=" font-bold">{func.name}</p>
                            <div className="flex flex-row gap-2 flex-wrap text-gray-500">
                              (
                              {func.inputs.map((input, idx) => (
                                <p key={idx} className="text-sm">
                                  {idx === 0 ? "" : ","}
                                  {input.name}
                                </p>
                              ))}
                              )
                            </div>
                          </div>
                          <span>
                            {expandedFunctions[func.name] ? "−" : "+"}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2">
                          {expandedFunctions[func.name] && (
                            <div className="flex flex-col gap-4 pt-2">
                              {func.inputs.map((input, idx) => (
                                <div key={idx} className="flex flex-col gap-2">
                                  <label className="text-sm font-medium w-full">
                                    {input.name} ({input.type})
                                  </label>
                                  <input
                                    type="text"
                                    className="border border-[#8E8E8E] p-2"
                                    placeholder={`Enter ${input.type}`}
                                    value={
                                      expandedFunctions[func.name][idx]
                                        ?.value || ""
                                    }
                                    onChange={(e) =>
                                      handleInputChange(
                                        func.name,
                                        idx,
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              ))}

                              <button
                                className={`px-4 py-2 mt-2 w-fit ${
                                  functionResults[func.name]?.loading
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-[#4A4A4A] hover:bg-[#6E6E6E]"
                                } text-white`}
                                onClick={() => handleFunctionCall(func.name)}
                                disabled={functionResults[func.name]?.loading}
                              >
                                {functionResults[func.name]?.loading
                                  ? "Querying..."
                                  : "Query"}
                              </button>

                              {functionResults[func.name] && (
                                <div className="mt-4">
                                  {functionResults[func.name].loading ? (
                                    <div className="text-gray-600">
                                      Loading...
                                    </div>
                                  ) : functionResults[func.name].error ? (
                                    <div className="text-red-500 p-3 bg-red-50 border border-red-200">
                                      <p className="font-medium">Error:</p>
                                      <p className="text-sm">
                                        {functionResults[func.name].error}
                                      </p>
                                    </div>
                                  ) : functionResults[func.name].data !==
                                    null ? (
                                    <div className="bg-gray-50 p-3 border border-gray-200">
                                      <div className="flex flex-row items-center justify-between mb-4">
                                        <p className="font-medium text-sm">
                                          Result:
                                        </p>
                                        <div className="flex gap-2">
                                          {DisplayFormat.map((format) => (
                                            <button
                                              className={`px-2 py-1 text-xs ${
                                                (displayFormats[func.name] ??
                                                  "decimal") === format
                                                  ? "bg-[#4A4A4A] text-white"
                                                  : "bg-gray-200"
                                              }`}
                                              onClick={() =>
                                                handleFormatChange(
                                                  func.name,
                                                  format as DisplayFormatTypes
                                                )
                                              }
                                            >
                                              {format}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                      <pre className="text-sm overflow-x-auto whitespace-pre-wrap break-words">
                                        {(() => {
                                          const data =
                                            functionResults[func.name]?.data;
                                          const format =
                                            displayFormats[func.name] ||
                                            "decimal";

                                          const safeStringify = (value: any) =>
                                            JSON.stringify(
                                              value,
                                              (_, v) =>
                                                typeof v === "bigint"
                                                  ? v.toString()
                                                  : v,
                                              2
                                            );

                                          if (Array.isArray(data)) {
                                            return data.map(
                                              (item: any, index: number) => (
                                                <div
                                                  key={index}
                                                  className="mb-1"
                                                >
                                                  {format === "decimal"
                                                    ? safeStringify(item)
                                                    : convertValue(item)?.[
                                                        format
                                                      ] || safeStringify(item)}
                                                </div>
                                              )
                                            );
                                          }

                                          return (
                                            <div className="mb-1">
                                              {format === "decimal"
                                                ? safeStringify(data)
                                                : convertValue(data)?.[
                                                    format
                                                  ] || safeStringify(data)}
                                            </div>
                                          );
                                        })()}
                                      </pre>
                                    </div>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedDataTab === "Write Contract" ? (
                  <>
                    <div className="flex justify-between items-center p-4 bg-gray-50 border border-[#8E8E8E] mb-4">
                      <div className="flex flex-col">
                        <p className="text-sm font-medium">Wallet Status</p>
                        <p className="text-sm">
                          {status === "connected" && address
                            ? `Connected: ${truncateString(address)}`
                            : status === "connecting"
                            ? "Connecting..."
                            : "Not Connected"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {status !== "connected" ? (
                          <button
                            onClick={() => setIsWalletModalOpen(true)}
                            className="px-4 py-2 bg-[#4A4A4A] hover:bg-[#6E6E6E] text-white"
                          >
                            Connect Wallet
                          </button>
                        ) : (
                          <button
                            onClick={() => disconnect()}
                            className="px-4 py-2 bg-[#4A4A4A] hover:bg-[#6E6E6E] text-white"
                          >
                            Disconnect
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      {writeFunctions.map((func, index) => (
                        <div
                          key={index}
                          className="flex flex-col p-4 border border-[#8E8E8E] border-dashed"
                        >
                          <div
                            className="flex justify-between items-center cursor-pointer"
                            onClick={() => {
                              if (!expandedFunctions[func.name]) {
                                setExpandedFunctions((prev) => ({
                                  ...prev,
                                  [func.name]: func.inputs.map((input) => ({
                                    name: input.name,
                                    type: input.type,
                                    value: "",
                                  })),
                                }));
                              } else {
                                setExpandedFunctions((prev) => {
                                  const newState = { ...prev };
                                  delete newState[func.name];
                                  return newState;
                                });
                              }
                            }}
                          >
                            <div className="flex flex-row gap-2 w-full flex-wrap">
                              <p className="font-bold">{func.name}</p>
                              <div className="flex flex-row gap-2 flex-wrap text-gray-500">
                                (
                                {func.inputs.map((input, idx) => (
                                  <p key={idx} className="text-sm">
                                    {idx === 0 ? "" : ","}
                                    {input.name}
                                  </p>
                                ))}
                                )
                              </div>
                            </div>
                            <span>
                              {expandedFunctions[func.name] ? "−" : "+"}
                            </span>
                          </div>

                          <div className="flex flex-col gap-2">
                            {expandedFunctions[func.name] && (
                              <div className="flex flex-col gap-4 pt-4">
                                {func.inputs.map((input, idx) => (
                                  <div
                                    key={idx}
                                    className="flex flex-col gap-2"
                                  >
                                    <label className="text-sm font-medium w-full">
                                      {input.name} ({input.type})
                                    </label>
                                    <input
                                      type="text"
                                      className="border border-[#8E8E8E] p-2 "
                                      placeholder={`Enter ${input.type}`}
                                      value={
                                        expandedFunctions[func.name][idx]
                                          ?.value || ""
                                      }
                                      onChange={(e) =>
                                        handleInputChange(
                                          func.name,
                                          idx,
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                ))}

                                <button
                                  className={`px-4 py-2 mt-2 w-fit ${
                                    !address
                                      ? "bg-gray-400 cursor-not-allowed"
                                      : functionResults[func.name]?.loading
                                      ? "bg-gray-400 cursor-not-allowed"
                                      : "bg-[#4A4A4A] hover:bg-[#6E6E6E]"
                                  } text-white`}
                                  onClick={() =>
                                    handleWriteFunctionCall(func.name)
                                  }
                                  disabled={
                                    !address ||
                                    functionResults[func.name]?.loading
                                  }
                                >
                                  {!address
                                    ? "Connect Wallet to Execute"
                                    : functionResults[func.name]?.loading
                                    ? "Executing..."
                                    : "Execute"}
                                </button>

                                {functionResults[func.name]?.data
                                  ?.transaction_hash && (
                                  <div className="mt-2 text-sm">
                                    <p className="font-medium">
                                      Transaction Hash:
                                    </p>
                                    <a
                                      href={`/transactions/${
                                        functionResults[func.name].data
                                          .transaction_hash
                                      }`}
                                      className="text-blue-600 hover:text-blue-800 break-all"
                                    >
                                      {
                                        functionResults[func.name].data
                                          .transaction_hash
                                      }
                                    </a>
                                  </div>
                                )}

                                {functionResults[func.name] && (
                                  <div className="mt-4">
                                    {functionResults[func.name].loading ? (
                                      <div className="text-gray-600">
                                        Loading...
                                      </div>
                                    ) : functionResults[func.name].error ? (
                                      <div className="text-red-500 p-3 bg-red-50 border border-red-200">
                                        <p className="font-medium">Error:</p>
                                        <p className="text-sm">
                                          {functionResults[func.name].error}
                                        </p>
                                      </div>
                                    ) : functionResults[func.name].data !==
                                      null ? (
                                      <div className="bg-gray-50 p-3 border border-gray-200">
                                        <p className="font-medium text-sm">
                                          Result:
                                        </p>
                                        <pre className="text-sm overflow-x-auto whitespace-pre-wrap break-words">
                                          {JSON.stringify(
                                            functionResults[func.name].data,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </div>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-full p-2 flex items-center justify-center min-h-[150px] text-xs lowercase">
                    <span className="text-[#D0D0D0]">No data found</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Connection Modal */}
      <WalletConnectModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
}
