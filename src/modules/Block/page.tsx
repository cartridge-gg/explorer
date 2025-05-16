import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { formatNumber } from "@/shared/utils/number";
import {
  formatSnakeCaseToDisplayValue,
  truncateString,
} from "@/shared/utils/string";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { EXECUTION_RESOURCES_KEY_MAP } from "@/constants/rpc";
import dayjs from "dayjs";
import { cairo } from "starknet";
import { useScreen } from "@/shared/hooks/useScreen";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbSeparator,
} from "@/shared/components/breadcrumbs";
import PageHeader from "@/shared/components/PageHeader";
import { SectionBox } from "@/shared/components/section/SectionBox";
import { SectionBoxEntry } from "@/shared/components/section";
import { TxList } from "./TxList";
import { EventList } from "./EventList";
import DetailsPageSelector from "@/shared/components/DetailsPageSelector";
import BlockNavigation from "./BlockNavigation";
import AddressDisplay from "@/shared/components/AddressDisplay";
import { TransactionTableData, EventTableData } from "@/types/types";
import { NotFound } from "../NotFound/page";

const DataTabs = ["Transactions", "Events", "Messages", "State Updates"];

interface BlockData {
  block?: Awaited<ReturnType<typeof RPC_PROVIDER.getBlockWithReceipts>>;
  txs: TransactionTableData[];
  events: EventTableData[];
  executions: {
    ecdsa: number;
    keccak: number;
    bitwise: number;
    pedersen: number;
    poseidon: number;
    range_check: number;
    segment_arena: number;
  };
  blockComputeData: {
    gas: number;
    steps: number;
    data_gas: number;
  };
}

const initialData: BlockData = {
  txs: [],
  events: [],
  executions: {
    ecdsa: 0,
    keccak: 0,
    bitwise: 0,
    pedersen: 0,
    poseidon: 0,
    range_check: 0,
    segment_arena: 0,
  },
  blockComputeData: {
    gas: 0,
    steps: 0,
    data_gas: 0,
  },
};

export function Block() {
  const { isMobile } = useScreen();
  const { blockId } = useParams<{ blockId: string }>();
  const [selectedDataTab, setSelectedDataTab] = useState(DataTabs[0]);

  const {
    data: { block, txs, events, executions, blockComputeData },
    isLoading,
    error,
  } = useQuery({
    queryKey: ["block", blockId],
    queryFn: async () => {
      const block = await RPC_PROVIDER.getBlockWithReceipts(blockId);
      const txs = block.transactions.map(({ transaction, receipt }, id) => ({
        id,
        type: transaction.type,
        hash: receipt.transaction_hash,
        status: receipt.execution_status,
      }));
      const events = block.transactions.flatMap(({ receipt }) =>
        receipt.events.map((e, id) => ({
          id,
          txn_hash: receipt.transaction_hash,
          from: e.from_address,
          // Add required field based on EventTableData interface
          age: "",
        })),
      );
      const { executions, blockComputeData } = block.transactions.reduce(
        (acc, { receipt }) => {
          if (!receipt.execution_resources) return acc;

          Object.keys(receipt.execution_resources).forEach((key) => {
            switch (key) {
              case "steps": {
                acc.blockComputeData.steps =
                  acc.blockComputeData.steps + receipt.execution_resources[key];
                break;
              }
              case "data_availability": {
                acc.blockComputeData.gas =
                  acc.blockComputeData.gas +
                  receipt.execution_resources[key].l1_gas;
                acc.blockComputeData.data_gas =
                  acc.blockComputeData.data_gas +
                  receipt.execution_resources[key].l1_data_gas;
                break;
              }
              default: {
                const _key = key as keyof typeof EXECUTION_RESOURCES_KEY_MAP;
                const keyMap = EXECUTION_RESOURCES_KEY_MAP[
                  _key
                ] as keyof typeof acc.executions;
                if (!keyMap) return acc;

                acc.executions[keyMap] =
                  acc.executions[keyMap] +
                  (receipt.execution_resources[_key] ?? 0);
              }
            }
          });

          return acc;
        },
        {
          executions: initialData.executions,
          blockComputeData: initialData.blockComputeData,
        },
      );

      return {
        block,
        txs,
        events,
        executions,
        blockComputeData,
      };
    },
    enabled: typeof blockId !== "undefined",
    initialData,
  });

  if (isLoading || (!block && !error)) {
    return (
      <div className="w-full h-screen flex items-center justify-center animate-pulse">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!block) {
    return <NotFound />;
  }

  return (
    <div id="block-details" className="w-full flex-grow gap-8">
      <div className="flex justify-between mb-2">
        <Breadcrumb className="flex items-center">
          <BreadcrumbItem to="..">Explorer</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem to="../blocks">Blocks</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{blockId}</BreadcrumbItem>
        </Breadcrumb>

        <BlockNavigation currentBlockNumber={block.block_number} />
      </div>

      <PageHeader
        className="mb-6"
        title={`Block #${block.block_number}`}
        subtext={block.status}
        subtextRightComponent={
          <div className="text-[#5D5D5D]">
            {block.timestamp
              ? dayjs.unix(block.timestamp).format("MMM D YYYY HH:mm:ss")
              : ""}
          </div>
        }
      />

      <div className="flex flex-col sl:flex-row sl:h-[73vh] gap-4">
        <div className="sl:w-[468px] sl:min-w-[468px] flex flex-col gap-[6px] sl:overflow-y-scroll">
          <SectionBox>
            <SectionBoxEntry title="Hash">
              {isMobile ? truncateString(block.block_hash) : block.block_hash}
            </SectionBoxEntry>

            <SectionBoxEntry title="Number">
              {block.block_number}
            </SectionBoxEntry>

            <SectionBoxEntry title="State root">
              {isMobile ? truncateString(block.new_root) : block.new_root}
            </SectionBoxEntry>

            <SectionBoxEntry title="Sequencer address">
              <AddressDisplay value={block.sequencer_address} />
            </SectionBoxEntry>
          </SectionBox>

          <SectionBox title="Gas Prices">
            <SectionBoxEntry title="L1 Gas Prices" bold={false}>
              <table className="w-full">
                <tbody>
                  <tr>
                    <th className="w-[67px]">ETH</th>
                    <td>
                      {block.l1_gas_price
                        ? formatNumber(
                            Number(cairo.felt(block.l1_gas_price.price_in_wei)),
                          )
                        : 0}{" "}
                      WEI
                    </td>
                  </tr>
                  <tr>
                    <th className="w-min">STRK</th>
                    <td>
                      {block.l1_gas_price
                        ? formatNumber(
                            Number(cairo.felt(block.l1_gas_price.price_in_fri)),
                          )
                        : 0}{" "}
                      FRI
                    </td>
                  </tr>
                </tbody>
              </table>
            </SectionBoxEntry>

            <SectionBoxEntry title="L1 Data Gas Prices" bold={false}>
              <table className="w-full">
                <tbody>
                  <tr>
                    <th className="w-[67px]">ETH</th>
                    <td>
                      {block.l1_data_gas_price
                        ? formatNumber(
                            Number(
                              cairo.felt(block.l1_data_gas_price?.price_in_wei),
                            ),
                          )
                        : 0}{" "}
                      ETH
                    </td>
                  </tr>
                  <tr>
                    <th className="w-min">STRK</th>
                    <td>
                      {block.l1_data_gas_price
                        ? formatNumber(
                            Number(
                              cairo.felt(block.l1_data_gas_price?.price_in_fri),
                            ),
                          )
                        : 0}{" "}
                      FRI
                    </td>
                  </tr>
                </tbody>
              </table>
            </SectionBoxEntry>
          </SectionBox>

          <SectionBox title="Execution Resources">
            <table className="w-full mb-1">
              <thead>
                <tr>
                  <th colSpan={2}>GAS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th className="w-[90px]">L1 GAS</th>
                  <td>{formatNumber(blockComputeData.gas)}</td>
                </tr>
                <tr>
                  <th className="w-min">L1 DA GAS</th>
                  <td>{formatNumber(blockComputeData.data_gas)}</td>
                </tr>
              </tbody>
            </table>

            <table className="w-full mb-1">
              <thead>
                <tr>
                  <th>STEPS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{formatNumber(blockComputeData.steps)}</td>
                </tr>
              </tbody>
            </table>

            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th colSpan={4} className="p-1 bg-gray-100 border">
                    BUILTINS COUNTER
                  </th>
                </tr>
              </thead>

              <tbody className="text-center">
                {Object.entries(executions).map(
                  ([key, value], index, array) => {
                    const heading = formatSnakeCaseToDisplayValue(key);
                    return index % 2 === 0 ? (
                      <tr key={index} className="w-full">
                        <th className="w-[111px]">{heading}</th>
                        <td>{formatNumber(value)}</td>

                        {array[index + 1] ? (
                          <>
                            <th className="w-[111px]">
                              {formatSnakeCaseToDisplayValue(
                                array[index + 1][0],
                              )}
                            </th>
                            <td>{formatNumber(array[index + 1][1])}</td>
                          </>
                        ) : (
                          <>
                            <th className="w-[111px]"></th>
                            <td></td>
                          </>
                        )}
                      </tr>
                    ) : null;
                  },
                )}
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

          <div className="bg-white flex flex-col gap-3 mt-[6px] px-[15px] py-[17px] border border-borderGray">
            <div className="w-full h-full">
              {selectedDataTab === "Transactions" ? (
                <TxList transactions={txs} />
              ) : selectedDataTab === "Events" ? (
                <EventList events={events} />
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
  );
}
