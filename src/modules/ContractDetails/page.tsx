import { useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import { truncateString } from "@/shared/utils/string";
import { useCallback, useEffect, useState } from "react";
import { RPC_PROVIDER } from "@/services/starknet_provider_config";

const DataTabs = [
  // "Transactions",
  // "Events",
  // "Messages",
  "Read Contract",
  "Write Contract",
  // "Read Storage",
  // "Code",
];

export default function ContractDetails() {
  const { contractAddress } = useParams<{
    contractAddress: string;
  }>();
  const { isMobile } = useScreen();
  const [selectedDataTab, setSelectedDataTab] = useState(DataTabs[0]);
  const [classHash, setClassHash] = useState<string | null>(null);

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
  }, [contractAddress]);

  useEffect(() => {
    if (!contractAddress) return;
    fetchContractDetails();
  }, [contractAddress, fetchContractDetails]);

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
                      className="flex flex-col gap-2 p-4 border border-[#8E8E8E] border-dashed"
                    >
                      <p className="font-bold">{func.name}</p>

                      <div className="flex flex-col gap-2">
                        <div className="flex flex-row gap-2 w-full flex-wrap text-gray-500">
                          (
                          {func.inputs.map((input, idx) => (
                            <p className="text-sm">
                              {idx === 0 ? "" : ","}
                              {input.name}
                            </p>
                          ))}
                          )
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedDataTab === "Write Contract" ? (
                <div className="flex flex-col gap-4 p-4">
                  {writeFunctions.map((func, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 p-4 border border-[#8E8E8E] border-dashed"
                    >
                      <p className="font-bold">{func.name}</p>

                      <div className="flex flex-col gap-2">
                        <div className="flex flex-row gap-2 w-full flex-wrap text-gray-500">
                          (
                          {func.inputs.map((input, idx) => (
                            <p className="text-sm">
                              {idx === 0 ? "" : ","}
                              {input.name}
                            </p>
                          ))}
                          )
                        </div>
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
