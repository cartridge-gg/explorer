import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { formatNumber, padNumber } from "@/shared/utils/number";
import {
  formatSnakeCaseToDisplayValue,
  truncateString,
} from "@/shared/utils/string";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { EXECUTION_RESOURCES_KEY_MAP } from "@/constants/rpc";
import dayjs from "dayjs";
import { cairo } from "starknet";
import { useScreen } from "@/shared/hooks/useScreen";
import { TransactionTableData, EventTableData } from "@/types/types";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from "@/shared/components/breadcrumbs";
import PageHeader from "@/shared/components/PageHeader";
import { SectionBox } from "@/shared/components/section/SectionBox";
import { SectionBoxEntry } from "@/shared/components/section";
import { TxList } from "@/shared/components/dataTable/TxList";
import EventList from "./EventList";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/tab";

export default function BlockDetails() {
  const { isMobile } = useScreen();
  const { blockNumber } = useParams<{ blockNumber: string }>();

  const [txsTable, setTxsTable] = useState<TransactionTableData[]>([]);
  const [eventsTable, setEventsTable] = useState<EventTableData[]>([]);
  const [executionTable, setExecutionTable] = useState({
    bitwise: 0,
    pedersen: 0,
    range_check: 0,
    poseidon: 0,
    ecdsa: 0,
    segment_arena: 0,
    keccak: 0,
  });

  const [blockComputeData, setBlockComputeData] = useState({
    gas: 0,
    data_gas: 0,
    steps: 0,
  });

  const { data: BlockReceipt } = useQuery({
    queryKey: [""],
    queryFn: () => RPC_PROVIDER.getBlockWithTxs(blockNumber ?? 0),
    enabled: !!blockNumber,
  });

  const processBlockInformation = useCallback(async (transactions) => {
    if (!transactions) return;

    const transactions_table_data: TransactionTableData[] = [];
    await Promise.all(
      transactions.map((tx) => {
        return RPC_PROVIDER.getTransactionReceipt(tx.transaction_hash).then(
          (receipt) => {
            // process block events
            if (receipt?.events) {
              receipt.events.forEach((event) => {
                setEventsTable((prev) => {
                  return [
                    ...prev,
                    {
                      id: padNumber(prev.length + 1),
                      txn_hash: tx.transaction_hash,
                      from: event.from_address,
                    },
                  ];
                });
              });
            }

            // process execution resources
            Object.keys(receipt?.execution_resources).forEach((key) => {
              if (key === "steps") {
                setBlockComputeData((prev) => ({
                  ...prev,
                  steps: prev.steps + receipt.execution_resources[key],
                }));
              } else if (key === "data_availability") {
                setBlockComputeData((prev) => ({
                  ...prev,
                  gas: prev.gas + receipt.execution_resources[key].l1_data_gas,
                  data_gas:
                    prev.data_gas + receipt.execution_resources[key].l1_gas,
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

            // process info for transactions table
            transactions_table_data.push({
              id: padNumber(transactions_table_data.length + 1),
              // hash_display: `${
              //   tx.transaction_hash
              // } ( ${formatSnakeCaseToDisplayValue(tx.type)} )`,

              type: tx.type,
              status: receipt.statusReceipt,
              hash: tx.transaction_hash,
            });
          }
        );
      })
    );

    setTxsTable(transactions_table_data);
  }, []);

  useEffect(() => {
    if (!BlockReceipt) return;

    processBlockInformation(BlockReceipt?.transactions);
  }, [BlockReceipt, processBlockInformation]);

  return (
    <div className="w-full flex-grow gap-8">
      <Breadcrumb className="mb-3">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink className="" href="/">
              .
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink className=" text-sm" href="/">
              explrr
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink className=" text-sm" href="/blocks">
              blocks
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className=" text-sm">{blockNumber}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        className="mb-6"
        title={`Block #${blockNumber}`}
        subtext={BlockReceipt?.status}
      />

      <div className="flex flex-col sl:flex-row sl:h-[66vh] gap-4">
        <div className="flex flex-col gap-[6px] sl:overflow-y-scroll">
          <SectionBox variant="upper-half">
            <SectionBoxEntry title="Hash">
              {isMobile
                ? truncateString(BlockReceipt?.block_hash)
                : BlockReceipt?.block_hash}
            </SectionBoxEntry>

            <SectionBoxEntry title="Number">
              {BlockReceipt?.block_number}
            </SectionBoxEntry>

            <SectionBoxEntry title="Timestamp">
              {`${BlockReceipt?.timestamp} (${dayjs
                .unix(BlockReceipt?.timestamp)
                .format("MMM D YYYY HH:mm:ss")})`}
            </SectionBoxEntry>

            <SectionBoxEntry title="State root">
              {isMobile
                ? truncateString(BlockReceipt?.new_root)
                : BlockReceipt?.new_root}
            </SectionBoxEntry>

            <SectionBoxEntry title="Sequencer address">
              {isMobile
                ? truncateString(BlockReceipt?.sequencer_address)
                : BlockReceipt?.sequencer_address}
            </SectionBoxEntry>
          </SectionBox>

          <SectionBox title="Gas Prices" variant="upper-half">
            <SectionBoxEntry title="L1 Gas Prices" bold={false}>
              <table className="w-full">
                <tbody>
                  <tr>
                    <th className="w-[67px]">ETH</th>
                    <td>
                      {BlockReceipt?.l1_gas_price
                        ? formatNumber(
                          Number(
                            cairo.felt(
                              BlockReceipt?.l1_gas_price?.price_in_wei
                            )
                          )
                        )
                        : 0}{" "}
                      WEI
                    </td>
                  </tr>
                  <tr>
                    <th className="w-min">STRK</th>
                    <td>
                      {BlockReceipt?.l1_gas_price
                        ? formatNumber(
                          Number(
                            cairo.felt(
                              BlockReceipt?.l1_gas_price?.price_in_fri
                            )
                          )
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
                      {BlockReceipt?.l1_data_gas_price
                        ? formatNumber(
                          Number(
                            cairo.felt(
                              BlockReceipt?.l1_data_gas_price?.price_in_wei
                            )
                          )
                        )
                        : 0}{" "}
                      ETH
                    </td>
                  </tr>
                  <tr>
                    <th className="w-min">STRK</th>
                    <td>
                      {BlockReceipt?.l1_data_gas_price
                        ? formatNumber(
                          Number(
                            cairo.felt(
                              BlockReceipt?.l1_data_gas_price?.price_in_fri
                            )
                          )
                        )
                        : 0}{" "}
                      FRI
                    </td>
                  </tr>
                </tbody>
              </table>
            </SectionBoxEntry>
          </SectionBox>

          <SectionBox title="Execution Resources" variant="full">
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
                                array[index + 1][0]
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
                  }
                )}
              </tbody>
            </table>
          </SectionBox>
        </div>

        <Tabs defaultValue="transactions">
          <TabsList>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="state-updates">State Updates</TabsTrigger>
          </TabsList>

          <TabsContent className="h-full" value="transactions">
            <TxList transactions={txsTable} />
          </TabsContent>

          <TabsContent value="events" className="p-0 h-full">
            <EventList events={eventsTable} />
          </TabsContent>

          <TabsContent value="messages" className="p-4 text-center">
            <span className="text-[#D0D0D0]">No data found</span>
          </TabsContent>

          <TabsContent value="state-updates" className="p-4 text-center">
            <span className="text-[#D0D0D0]">No data found</span>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
