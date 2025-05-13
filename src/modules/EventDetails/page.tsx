import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { truncateString } from "@/shared/utils/string";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import dayjs from "dayjs";
import { useCallback, useEffect } from "react";
import { useState } from "react";
import { events } from "starknet";
import { CallData } from "starknet";
import { convertValue } from "@/shared/utils/rpc_utils";
import { EventDataItem, DisplayFormatTypes } from "@/types/types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbSeparator,
} from "@/shared/components/breadcrumbs";
import PageHeader from "@/shared/components/PageHeader";
import { SectionBox } from "@/shared/components/section/SectionBox";
import { SectionBoxEntry } from "@/shared/components/section";

const DisplayFormat = ["dec", "hex", "string"] as const;

export default function EventDetails() {
  const { eventId } = useParams<{
    eventId: string;
  }>();

  const [txnHash, setTxnHash] = useState<string | null>(null);
  const [eventIndex, setEventIndex] = useState<string | null>(null);
  const [eventData, setEventData] = useState<EventDataItem[]>([]);
  const [eventKeys, setEventKeys] = useState<EventDataItem[]>([]);
  const [event, setEvent] = useState<any | null>(null);
  const [displayFormats, setDisplayFormats] = useState<
    Record<string, DisplayFormatTypes>
  >({});

  useEffect(() => {
    const [currentTxnHash, currentEventIndex] = eventId?.split("-") ?? [];
    setTxnHash(currentTxnHash);
    setEventIndex(currentEventIndex);
  }, [eventId]);

  const { isMobile } = useScreen();

  const { data: TransactionReceipt } = useQuery({
    queryKey: ["txn_receipt", txnHash],
    queryFn: () => RPC_PROVIDER.getTransactionReceipt(txnHash ?? "0"),
    enabled: !!txnHash,
  });

  const { data: BlockDetails } = useQuery({
    queryKey: ["txn_block_details", TransactionReceipt?.block_number],
    queryFn: () => RPC_PROVIDER.getBlock(TransactionReceipt?.block_number),
    enabled: !!TransactionReceipt?.block_number,
  });

  const fetchEventDetails = useCallback(async () => {
    if (!txnHash || !eventIndex) return;

    const eventsData = TransactionReceipt?.events?.[Number(eventIndex)];
    setEvent(eventsData);

    if (!eventsData) return;

    const contract_abi = await RPC_PROVIDER.getClassAt(
      eventsData.from_address
    ).then((res) => res.abi);

    const eventsC = await RPC_PROVIDER.getEvents({
      address: eventsData.from_address,
      chunk_size: 100,
      keys: [eventsData.keys],
      from_block: {
        block_number: TransactionReceipt?.block_number,
      },
      to_block: { block_number: TransactionReceipt?.block_number },
    });
    const abiEvents = events.getAbiEvents(contract_abi);
    const abiStructs = CallData.getAbiStruct(contract_abi);
    const abiEnums = CallData.getAbiEnum(contract_abi);
    const parsedEvent = events.parseEvents(
      eventsC.events,
      abiEvents,
      abiStructs,
      abiEnums
    );

    if (!parsedEvent) return;

    const eventDataMap = parsedEvent.filter(
      (e) => e.transaction_hash === TransactionReceipt?.transaction_hash
    )?.[0];

    if (!eventDataMap) return;

    const currentEvent = eventDataMap;
    // should contain ":"
    const eventDataKey = Object.keys(currentEvent).filter((key) =>
      key.includes(":")
    );

    const eventKeyType: Record<string, string> = {};
    const eventDataType: Record<string, string> = {};

    // check in abi events objects if name = eventDataKey[0]
    Object.keys(abiEvents).forEach((key) => {
      if (abiEvents[key].name === eventDataKey[0]) {
        const eventInputType = abiEvents[key].members;

        // process the eventInputType
        eventInputType?.forEach((input: any) => {
          if (input.kind === "key") {
            eventKeyType[input.name] = input.type;
          } else {
            eventDataType[input.name] = input.type;
          }
        });
      }
    });

    const result_key: EventDataItem[] = [];
    const result_data: EventDataItem[] = [];
    Object.keys(eventDataMap[eventDataKey[0]])?.forEach((key) => {
      if (eventKeyType[key]) {
        const finalData: EventDataItem = {
          input: key,
          input_type: eventKeyType[key],
          data: convertValue(eventDataMap[eventDataKey[0]][key])?.hex || "",
        };
        result_key.push(finalData);
      } else {
        const finalData: EventDataItem = {
          input: key,
          input_type: eventDataType[key],
          data: convertValue(eventDataMap[eventDataKey[0]][key])?.hex || "",
        };
        result_data.push(finalData);
      }
    });

    setEventData(result_data);
    setEventKeys(result_key);
  }, [
    TransactionReceipt?.block_number,
    TransactionReceipt?.events,
    TransactionReceipt?.transaction_hash,
    eventIndex,
    txnHash,
  ]);

  useEffect(() => {
    fetchEventDetails();
  }, [fetchEventDetails, txnHash, eventIndex]);

  const handleFormatChange = (key: string, format: DisplayFormatTypes) => {
    setDisplayFormats((prev) => ({
      ...prev,
      [key]: format,
    }));
  };

  return (
    <div className="w-full flex-grow gap-8">
      <Breadcrumb className="mb-3">
        <BreadcrumbSeparator />
        <BreadcrumbItem to="..">Explorer</BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>Events</BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {isMobile && eventId ? truncateString(eventId) : eventId}
        </BreadcrumbItem>
      </Breadcrumb>

      <PageHeader
        className="mb-6"
        title={`Event Details`}
        subtext={isMobile && eventId ? truncateString(eventId) : eventId}
        subtextRightComponent={
          <div className="text-[#5D5D5D]">
            {dayjs.unix(BlockDetails?.timestamp).format("MMM D YYYY HH:mm:ss")}{" "}
          </div>
        }
      />

      <div className="flex flex-col sl:flex-row gap-4">
        <div className="flex w-full sl:w-[35%] sl:min-w-[35%] sl:max-w-[35%] flex-col gap-4 sl:overflow-y-auto">
          <SectionBox variant="upper-half">
            <SectionBoxEntry title="Transaction Hash">
              {isMobile && txnHash ? truncateString(txnHash) : txnHash}
            </SectionBoxEntry>

            <SectionBoxEntry title="From Address">
              {isMobile && event?.from_address
                ? truncateString(event.from_address)
                : event?.from_address}
            </SectionBoxEntry>

            <SectionBoxEntry title="Block Number">
              {TransactionReceipt?.block_number}
            </SectionBoxEntry>

            <SectionBoxEntry title="Timestamp">
              {BlockDetails?.timestamp
                ? `${BlockDetails.timestamp} (${dayjs
                  .unix(BlockDetails.timestamp || 0)
                  .format("MMM D YYYY HH:mm:ss")})`
                : "Loading..."}
            </SectionBoxEntry>
          </SectionBox>

          <SectionBox title="Event Details" variant="upper-half">
            <SectionBoxEntry title="Keys">
              <div className="flex flex-col gap-2">
                {event?.keys?.length > 1 ? (
                  event.keys.map(
                    (key: string, index: number) =>
                      index !== 0 && (
                        <p key={index}>
                          {isMobile ? truncateString(key) : key}
                        </p>
                      )
                  )
                ) : (
                  <p>No data found</p>
                )}
              </div>
            </SectionBoxEntry>

            <SectionBoxEntry title="Data">
              <div className="flex flex-col gap-2 overflow-hidden">
                {event?.data?.map((data: string, index: number) => (
                  <p key={index} className="break-all">
                    {isMobile ? truncateString(data) : data}
                  </p>
                ))}
              </div>
            </SectionBoxEntry>
          </SectionBox>
        </div>

        <div className="flex flex-col w-full gap-2 sl:overflow-y-auto">
          <div
            style={{
              borderBottomStyle: "dashed",
              boxShadow: "0 2px 2px rgba(183, 183, 183, 0.25)",
            }}
            className="rounded-t-md overflow-clip px-[15px] py-4 border border-borderGray"
          >
            <span className="text-sm font-bold">Selector: </span>
            {event?.keys?.[0]}
          </div>
          {eventKeys.length > 0 ? (
            <div className="flex flex-col w-full gap-4 border rounded-md p-4">
              <div className="flex flex-row justify-between items-center px-2 py-2 uppercase">
                <h1 className="text-black text-lg font-bold">Event Keys</h1>
                <div className="flex gap-2">
                  {DisplayFormat.map((format) => (
                    <button
                      key={format}
                      className={`px-2 py-1 text-xs ${(displayFormats["keys"] ?? "hex") === format
                        ? "bg-[#4A4A4A] text-white"
                        : "bg-gray-200"
                        }`}
                      onClick={() => handleFormatChange("keys", format)}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="bg-[#D9D9D9] text-black">
                      <th className="px-4 py-2 text-left">Input</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventKeys?.map((key, index) => {
                      const format = displayFormats["keys"] ?? "hex";
                      return (
                        <tr
                          key={index}
                          className="border-b border-dashed last:border-b-0"
                        >
                          <td className="px-4 py-2 overflow-hidden text-left">
                            {key.input}
                          </td>
                          <td className="px-4 py-2 break-all">
                            {key.input_type}
                          </td>
                          <td className="px-4 py-2 break-all overflow-x-auto">
                            <div className="overflow-x-auto">
                              {(() => {
                                const converted = convertValue(key.data);
                                return converted ? converted[format] : key.data;
                              })()}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {eventData.length > 0 ? (
            <div className="flex flex-col w-full gap-4 border rounded-md p-4">
              <div className="flex flex-row justify-between items-center px-2 py-2 uppercase">
                <h1 className="text-black text-lg font-bold">Event Data</h1>
                <div className="flex gap-2">
                  {DisplayFormat.map((format) => (
                    <button
                      key={format}
                      className={`px-2 py-1 text-xs ${(displayFormats["data"] ?? "hex") === format
                        ? "bg-[#4A4A4A] text-white"
                        : "bg-gray-200"
                        }`}
                      onClick={() => handleFormatChange("data", format)}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="bg-[#D9D9D9] text-black">
                      <th className="px-4 py-2 text-left">Input</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-left">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventData?.map((item, index) => {
                      const format = displayFormats["data"] ?? "hex";
                      return (
                        <tr
                          key={index}
                          className="border-b border-dashed last:border-b-0"
                        >
                          <td className="px-4 text-left py-2 overflow-hidden">
                            {item.input}
                          </td>
                          <td className="px-4 text-left py-2 break-all">
                            {item.input_type}
                          </td>
                          <td className="px-4 text-left py-2 break-all overflow-x-auto">
                            <div className="overflow-x-auto">
                              {(() => {
                                const converted = convertValue(item.data);
                                return converted
                                  ? converted[format]
                                  : item.data;
                              })()}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
