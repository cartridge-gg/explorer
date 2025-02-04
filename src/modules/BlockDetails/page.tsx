import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import InfoBlock from "@/shared/components/infoblocks";
import SearchBar from "@/shared/components/search_bar";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useParams } from "react-router-dom";

const data = [
  ["BITWISE", "EC OP"],
  ["PEDERSEN", "ECDSA"],
  ["RANGE CHECK", "ADD MOD"],
  ["POSEIDON", "MUL MOD"],
  ["RANGE CHECK 96", "SEGMENT ARENA"],
];

const DataTabs = ["Transactions", "Events", "Messages", "State Updates"];
const TransactionTypeTabs = ["All", "Invoke", "Deploy Account", "Declare"];

export default function BlockDetails() {
  const { blockNumber } = useParams<{ blockNumber: string }>();

  const { data: BlockReceipt, isLoading } = useQuery({
    queryKey: [""],
    queryFn: () => RPC_PROVIDER.getBlock(BigInt(blockNumber ?? 0)),
    enabled: !!blockNumber,
  });

  const [selectedDataTab, setSelectedDataTab] = React.useState(DataTabs[0]);

  const [selectedTransactionType, setSelectedTransactionType] = React.useState(
    TransactionTypeTabs[0]
  );

  return (
    <div className="flex flex-col w-full gap-8 px-2 py-4">
      <div className="w-fit border-l-4 border-[#4A4A4A] flex justify-center items-center">
        <h1 className=" px-2">explrr .</h1>
      </div>
      <div className="flex flex-col w-full gap-16">
        <div className="flex flex-row w-full gap-12">
          <div className="w-full">
            <SearchBar />
          </div>
          <div className="w-full flex flex-row gap-2 justify-end">
            <InfoBlock left="Blocks" right="1,202,512" />
            <InfoBlock left="Txs" right="1,202,512" />
            <InfoBlock left="Classes" right="1,202,512" />
            <InfoBlock left="Contracts" right="1,202,512" />
          </div>
        </div>
      </div>

      <div className="flex flex-col w-full gap-4">
        <div>
          <h2>. / explrr / blocks / #{blockNumber}</h2>
        </div>

        <div>
          <div className="flex flex-row justify-between items-center uppercase bg-[#4A4A4A] px-4 py-2">
            <h1 className="text-white">Blocks</h1>
          </div>
          <div className=" flex flex-row gap-4 py-4">
            <div className=" flex flex-col gap-4">
              <div
                style={{
                  borderBottomStyle: "dashed",
                  borderBottomWidth: "2px",
                }}
                className="flex flex-col gap-4 p-4 border-[#8E8E8E] border-l-4 border-t border-r"
              >
                <div className="flex flex-col text-sm  gap-2">
                  <p className=" w-fit font-bold  px-2 py-1 bg-[#D9D9D9] text-black">
                    Hash
                  </p>
                  <p>
                    0x3849ce7e5a03676d2cec04ea28fa22b8250b708af0fd9a0e91f82c365b5c967
                  </p>
                </div>
                <div className="flex flex-col text-sm gap-1">
                  <p className=" w-fit font-bold  px-2 py-1 bg-[#D9D9D9] text-black">
                    Number
                  </p>
                  <p>1082356</p>
                </div>
                <div className="flex flex-col text-sm gap-1">
                  <p className=" w-fit font-bold  px-2 py-1 bg-[#D9D9D9] text-black">
                    Timestamp
                  </p>
                  <p>1737342046 ( Jan 19 2025 22:00:46 )</p>
                </div>
                <div className="flex flex-col text-sm gap-1">
                  <p className=" w-fit font-bold  px-2 py-1 bg-[#D9D9D9] text-black">
                    State root
                  </p>
                  <p>
                    0x1176a1bd84444c89232ec27754698e5d2e7e1a7f1539f12027f28b23ec9f3d8
                  </p>
                </div>
                <div className="flex flex-col text-sm gap-1">
                  <p className=" w-fit font-bold  px-2 py-1 bg-[#D9D9D9] text-black">
                    Sequencer address
                  </p>
                  <p>
                    0x1176a1bd84444c89232ec27754698e5d2e7e1a7f1539f12027f28b23ec9f3d8
                  </p>
                </div>
              </div>
              <div
                style={{
                  borderTopStyle: "dashed",
                  borderTopWidth: "2px",
                  borderBottomStyle: "dashed",
                  borderBottomWidth: "2px",
                }}
                className="flex flex-col h-fit gap-4 p-4 border-[#8E8E8E] border-l-4 border-t border-r"
              >
                <div className="flex flex-col text-sm  gap-1">
                  <p className=" w-fit font-bold text-black">GAS PRICE:</p>
                  <p>0.000341196011281633 STRK (341196.011281633 Gfri)</p>
                </div>
                <div className="flex flex-col text-sm gap-1">
                  <p className=" w-fit font-bold text-black">DATA GAS PRICE:</p>
                  <p>0.000341196011281633 STRK (341196.011281633 Gfri)</p>
                </div>
              </div>
              <div
                style={{
                  borderTopStyle: "dashed",
                  borderTopWidth: "2px",
                }}
                className="flex flex-col gap-4 p-4 border-[#8E8E8E] border-l-4 border-b border-r"
              >
                <div className="flex flex-col text-sm gap-4 w-full">
                  <div className="flex flex-row w-full text-center">
                    <div className=" flex flex-row w-full">
                      <div className=" w-full block bg-[#8E8E8E] py-2">
                        <p className=" text-white">GAS</p>
                      </div>
                      <div className=" w-full block py-2 border border-[#DBDBDB]">
                        <p>32,324,123</p>
                      </div>
                    </div>
                    <div className=" flex flex-row w-full">
                      <div className=" w-full block bg-[#8E8E8E] py-2">
                        <p className=" text-white">DA GAS</p>
                      </div>
                      <div className=" w-full block py-2 border border-[#DBDBDB]">
                        <p>52,656,412</p>
                      </div>
                    </div>
                  </div>
                  <div className=" w-full bg-[#8E8E8E] h-[1px]" />
                  <div className=" flex w-full flex-col text-center">
                    <div className=" w-full block bg-[#8E8E8E] py-2">
                      <p className=" text-white">STEPS</p>
                    </div>
                    <div className=" w-full block py-2 border border-[#DBDBDB]">
                      <p>32,324,123</p>
                    </div>
                  </div>
                  <div className=" flex flex-col">
                    <h2 className="text-md font-bold">BUILTINS COUNTER:</h2>
                    <table className="w-full border-collapse mt-2">
                      <tbody className=" text-center w-full">
                        {data.map((row, index) => (
                          <tr
                            key={index}
                            className="border-b last:border-b-0 w-full flex"
                          >
                            <td className="p-1 bg-gray-100 w-full">{row[0]}</td>
                            <td className="p-1 w-full">2165</td>
                            <td className="p-1 bg-gray-100 w-full">{row[1]}</td>
                            <td className="p-1 w-full">2165</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className="border w-full border-[#8E8E8E] flex flex-col gap-4">
              <div className="flex flex-row text-center px-4 pt-5">
                {DataTabs.map((tab, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor:
                        selectedDataTab === tab ? "#8E8E8E" : "#fff",
                      color: selectedDataTab === tab ? "#fff" : "#000",
                    }}
                    onClick={() => setSelectedDataTab(tab)}
                    className="w-full  border border-b-4 p-2 border-[#8E8E8E] uppercase cursor-pointer"
                  >
                    <p>{tab}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-row px-4 text-center">
                {TransactionTypeTabs.map((tab, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor:
                        selectedTransactionType === tab ? "#F3F3F3" : "#fff",
                      fontWeight:
                        selectedTransactionType === tab ? "bold" : "normal",
                    }}
                    onClick={() => setSelectedTransactionType(tab)}
                    className="w-fit border border-b-4 py-1 px-4 border-[#DBDBDB] uppercase cursor-pointer"
                  >
                    <p>{tab}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
