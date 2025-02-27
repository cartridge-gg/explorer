import { useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import { truncateString } from "@/shared/utils/string";
import { useCallback, useEffect, useState } from "react";
import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { Contract, Account } from "starknet";
import { convertValue } from "@/shared/utils/rpc_utils";
import { FunctionResult, DisplayFormatTypes } from "@/types/types";
import { connect, disconnect } from "get-starknet";

const DataTabs = [
  // "Transactions",
  // "Events",
  // "Messages",
  "Read Contract",
  "Write Contract",
  // "Read Storage",
  // "Code",
];

interface FunctionInput {
  name: string;
  type: string;
  value: string;
}

const DisplayFormat = ["decimal", "hex", "string"];

export default function ContractDetails() {
  const { contractAddress } = useParams<{
    contractAddress: string;
  }>();
  const { isMobile } = useScreen();
  const [selectedDataTab, setSelectedDataTab] = useState(DataTabs[0]);
  const [classHash, setClassHash] = useState<string | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const [readFunctions, setReadFunctions] = useState<
    {
      name: string;
      inputs: { name: string; type: string }[];
      selector: string;
    }[]
  >([]);

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

  const fetchContractDetails = useCallback(async () => {
    if (!contractAddress) return;

    // get class hash
    const classHash = await RPC_PROVIDER.getClassHashAt(contractAddress);
    setClassHash(classHash);

    // process contract functions
    const { abi: contract_abi } = await RPC_PROVIDER.getClassAt(
      contractAddress
    );

    const readFuncs: typeof readFunctions = [];
    const writeFuncs: typeof writeFunctions = [];

    contract_abi.forEach((item) => {
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

    const contract = new Contract(contract_abi, contractAddress, RPC_PROVIDER);
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

  const connectWallet = async () => {
    try {
      const starknet = await connect();
      if (!starknet) throw new Error("Failed to connect to wallet");

      await starknet.enable();
      const address = starknet.selectedAddress;
      setWalletAddress(address);

      // Create account instance
      if (starknet.account) {
        setAccount(starknet.account);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setFunctionResults((prev) => ({
        ...prev,
        wallet: {
          loading: false,
          error: "Failed to connect wallet",
          data: null,
        },
      }));
    }
  };

  const disconnectWallet = async () => {
    try {
      await disconnect();
      setAccount(null);
      setWalletAddress(null);
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
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

      // Create a new contract instance with the connected account
      const contractWithSigner = new Contract(
        contract.abi,
        contract.address,
        account
      );

      // Execute the transaction
      const result = await contractWithSigner.invoke(functionName, inputs);

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

  return (
    <div className="flex flex-col w-full gap-8 px-2 py-4">
      <div className="flex flex-col w-full gap-4">
        <div>
          <h2>
            . / explrr / contracts /{" "}
            {isMobile && contractAddress
              ? truncateString(contractAddress)
              : contractAddress}
          </h2>
        </div>

        <div className="flex flex-row justify-between items-center uppercase bg-[#4A4A4A] px-4 py-2">
          <h1 className="text-white">Contract</h1>
        </div>

        <div className="flex flex-col w-full lg:flex-row gap-4 pb-4">
          {/* Contract Info Section */}
          <div className="flex flex-col gap-4">
            <div
              style={{
                borderBottomStyle: "dashed",
                borderBottomWidth: "2px",
              }}
              className="flex flex-col gap-4 p-4 border-[#8E8E8E] border-l-4 border-t border-r"
            >
              <div className="flex flex-col text-sm gap-2">
                <p className="w-fit font-bold px-2 py-1 bg-[#D9D9D9] text-black">
                  Address
                </p>
                <p>
                  {isMobile && contractAddress
                    ? truncateString(contractAddress)
                    : contractAddress}
                </p>
              </div>
              <div className="flex flex-col text-sm gap-2">
                <p className="w-fit font-bold px-2 py-1 bg-[#D9D9D9] text-black">
                  Class Hash
                </p>
                <p>
                  {isMobile && classHash
                    ? truncateString(classHash)
                    : classHash}
                </p>
              </div>
            </div>
          </div>

          {/* Data Tabs Section */}
          <div className="border relative border-[#8E8E8E] flex flex-col gap-4 w-full overflow-y-auto max-h-[61.5rem]">
            <div className="flex sticky top-0 bg-white flex-col sm:flex-row text-center px-4 pt-5 pb-2">
              {DataTabs.map((tab, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor:
                      selectedDataTab === tab ? "#8E8E8E" : "#fff",
                    color: selectedDataTab === tab ? "#fff" : "#000",
                  }}
                  onClick={() => setSelectedDataTab(tab)}
                  className="w-full border border-b-4 p-2 border-[#8E8E8E] uppercase cursor-pointer"
                >
                  <p>{tab}</p>
                </div>
              ))}
            </div>

            <div className="h-full pb-2 w-full">
              {selectedDataTab === "Read Contract" ? (
                <div className="flex flex-col gap-4 p-4">
                  {readFunctions.map((func, index) => (
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
                        <span>{expandedFunctions[func.name] ? "−" : "+"}</span>
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
                                    expandedFunctions[func.name][idx]?.value ||
                                    ""
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

                            {/* Result Display Section */}
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
                                ) : functionResults[func.name].data !== null ? (
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
                                                format
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
                                              <div key={index} className="mb-1">
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
                                              : convertValue(data)?.[format] ||
                                                safeStringify(data)}
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
                <div className="flex flex-col gap-4 p-4">
                  {/* Add Wallet Connection Section */}
                  <div className="flex justify-between items-center p-4 bg-gray-50 border border-[#8E8E8E]">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">Wallet Status</p>
                      <p className="text-sm">
                        {walletAddress
                          ? `Connected: ${truncateString(walletAddress)}`
                          : "Not Connected"}
                      </p>
                    </div>
                    <button
                      onClick={walletAddress ? disconnectWallet : connectWallet}
                      className="px-4 py-2 bg-[#4A4A4A] hover:bg-[#6E6E6E] text-white"
                    >
                      {walletAddress ? "Disconnect" : "Connect Wallet"}
                    </button>
                  </div>

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
                        <span>{expandedFunctions[func.name] ? "−" : "+"}</span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {expandedFunctions[func.name] && (
                          <div className="flex flex-col gap-4 pt-4">
                            {func.inputs.map((input, idx) => (
                              <div key={idx} className="flex flex-col gap-2">
                                <label className="text-sm font-medium w-full">
                                  {input.name} ({input.type})
                                </label>
                                <input
                                  type="text"
                                  className="border border-[#8E8E8E] p-2 "
                                  placeholder={`Enter ${input.type}`}
                                  value={
                                    expandedFunctions[func.name][idx]?.value ||
                                    ""
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
                                !walletAddress
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : functionResults[func.name]?.loading
                                  ? "bg-gray-400 cursor-not-allowed"
                                  : "bg-[#4A4A4A] hover:bg-[#6E6E6E]"
                              } text-white`}
                              onClick={() => handleWriteFunctionCall(func.name)}
                              disabled={
                                !walletAddress ||
                                functionResults[func.name]?.loading
                              }
                            >
                              {!walletAddress
                                ? "Connect Wallet to Execute"
                                : functionResults[func.name]?.loading
                                ? "Executing..."
                                : "Execute"}
                            </button>

                            {/* Add transaction hash display if available */}
                            {functionResults[func.name]?.data
                              ?.transaction_hash && (
                              <div className="mt-2 text-sm">
                                <p className="font-medium">Transaction Hash:</p>
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

                            {/* Result Display Section */}
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
                                ) : functionResults[func.name].data !== null ? (
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
              ) : (
                <div className="p-4 text-center">
                  <p className="text-black">No data found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
