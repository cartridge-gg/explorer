import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { formatNumber } from "@/shared/utils/number";
import {
  formatSnakeCaseToDisplayValue,
  truncateString,
} from "@/shared/utils/string";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CACHE_TIME,
  EXECUTION_RESOURCES_KEY_MAP,
  STALE_TIME,
} from "@/constants/rpc";
import dayjs from "dayjs";
import { cairo } from "starknet";
import { useScreen } from "@/shared/hooks/useScreen";
import { TransactionTableData, EventTableData } from "@/types/types";
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
import { QUERY_KEYS } from "@/services/starknet_provider_config";
import BlockNavigation from "./BlockNavigation";
import AddressDisplay from "@/shared/components/AddressDisplay";

const DataTabs = ["Transactions", "Events", "Messages", "State Updates"];

export function Block() {
  const { isMobile } = useScreen();
  const { blockId } = useParams<{ blockId: string }>();
  const [selectedDataTab, setSelectedDataTab] = useState(DataTabs[0]);
  const [txsTable, setTxsTable] = useState<TransactionTableData[]>([]);
  const [eventsTable, setEventsTable] = useState<EventTableData[]>([]);
  const [executionTable, setExecutionTable] = useState({
    ecdsa: 0,
    keccak: 0,
    bitwise: 0,
    pedersen: 0,
    poseidon: 0,
    range_check: 0,
    segment_arena: 0,
  });

  const [blockComputeData, setBlockComputeData] = useState({
    gas: 0,
    steps: 0,
    data_gas: 0,
  });

  const { data: BlockWithReceipts, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.getBlockWithReceipts, blockId],
    queryFn: () => RPC_PROVIDER.getBlockWithReceipts(blockId),
    enabled: typeof blockId !== "undefined",
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });

  useEffect(() => {
    if (!BlockWithReceipts) return;

    // Reset state before processing
    setTxsTable([]);
    setEventsTable([]);
    setExecutionTable({
      ecdsa: 0,
      keccak: 0,
      bitwise: 0,
      pedersen: 0,
      poseidon: 0,
      range_check: 0,
      segment_arena: 0,
    });
    setBlockComputeData({
      gas: 0,
      steps: 0,
      data_gas: 0,
    });

    // Process transactions and receipts
    const transactions_table_data: TransactionTableData[] = [];

    BlockWithReceipts.transactions.forEach(({ transaction, receipt }) => {
      // Process block events
      if (receipt.events) {
        receipt.events.forEach((event) => {
          setEventsTable((prev) => [
            ...prev,
            {
              id: prev.length + 1,
              txn_hash: receipt.transaction_hash,
              from: event.from_address,
              age: "", // Add required field based on EventTableData interface
            },
          ]);
        });
      }

      // Process execution resources
      if (receipt.execution_resources) {
        Object.keys(receipt.execution_resources).forEach((key) => {
          if (key === "steps") {
            setBlockComputeData((prev) => ({
              ...prev,
              steps: prev.steps + receipt.execution_resources[key],
            }));
          } else if (key === "data_availability") {
            setBlockComputeData((prev) => ({
              ...prev,
              gas: prev.gas + receipt.execution_resources[key].l1_data_gas,
              data_gas: prev.data_gas + receipt.execution_resources[key].l1_gas,
            }));
          } else {
            const key_map = EXECUTION_RESOURCES_KEY_MAP[key];
            if (key_map) {
              setExecutionTable((prev) => ({
                ...prev,
                [key_map]: prev[key_map] + receipt.execution_resources[key],
              }));
            }
          }
        });
      }

      // Process info for transactions table
      transactions_table_data.push({
        id: transactions_table_data.length + 1,
        type: transaction.type,
        hash: receipt.transaction_hash,
        status: receipt.execution_status,
      });
    });

    setTxsTable(transactions_table_data);
  }, [BlockWithReceipts]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center animate-pulse">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
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

        <BlockNavigation currentBlockNumber={BlockWithReceipts?.block_number} />
      </div>

      <PageHeader
        className="mb-6"
        title={`Block #${BlockWithReceipts?.block_number}`}
        subtext={BlockWithReceipts?.status}
        subtextRightComponent={
          <div className="text-[#5D5D5D]">
            {BlockWithReceipts?.timestamp
              ? dayjs
                  .unix(BlockWithReceipts.timestamp)
                  .format("MMM D YYYY HH:mm:ss")
              : ""}
          </div>
        }
      />

      <div className="flex flex-col sl:flex-row sl:h-[73vh] gap-4">
        <div className="sl:w-[468px] sl:min-w-[468px] flex flex-col gap-[6px] sl:overflow-y-scroll">
          <SectionBox>
            <SectionBoxEntry title="Hash">
              {isMobile
                ? truncateString(BlockWithReceipts?.block_hash)
                : BlockWithReceipts?.block_hash}
            </SectionBoxEntry>

            <SectionBoxEntry title="Number">
              {BlockWithReceipts?.block_number}
            </SectionBoxEntry>

            <SectionBoxEntry title="State root">
              {isMobile
                ? truncateString(BlockWithReceipts?.new_root)
                : BlockWithReceipts?.new_root}
            </SectionBoxEntry>

            <SectionBoxEntry title="Sequencer address">
              <AddressDisplay value={BlockWithReceipts?.sequencer_address} />
            </SectionBoxEntry>
          </SectionBox>

          <SectionBox title="Gas Prices">
            <SectionBoxEntry title="L1 Gas Prices" bold={false}>
              <table className="w-full">
                <tbody>
                  <tr>
                    <th className="w-[67px]">ETH</th>
                    <td>
                      {BlockWithReceipts?.l1_gas_price
                        ? formatNumber(
                            Number(
                              cairo.felt(
                                BlockWithReceipts?.l1_gas_price?.price_in_wei,
                              ),
                            ),
                          )
                        : 0}{" "}
                      WEI
                    </td>
                  </tr>
                  <tr>
                    <th className="w-min">STRK</th>
                    <td>
                      {BlockWithReceipts?.l1_gas_price
                        ? formatNumber(
                            Number(
                              cairo.felt(
                                BlockWithReceipts?.l1_gas_price?.price_in_fri,
                              ),
                            ),
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
                      {BlockWithReceipts?.l1_data_gas_price
                        ? formatNumber(
                            Number(
                              cairo.felt(
                                BlockWithReceipts?.l1_data_gas_price
                                  ?.price_in_wei,
                              ),
                            ),
                          )
                        : 0}{" "}
                      ETH
                    </td>
                  </tr>
                  <tr>
                    <th className="w-min">STRK</th>
                    <td>
                      {BlockWithReceipts?.l1_data_gas_price
                        ? formatNumber(
                            Number(
                              cairo.felt(
                                BlockWithReceipts?.l1_data_gas_price
                                  ?.price_in_fri,
                              ),
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
                {Object.entries(executionTable).map(
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
                <TxList transactions={txsTable} />
              ) : selectedDataTab === "Events" ? (
                <EventList events={eventsTable} />
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
