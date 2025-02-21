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
import { convertToHex } from "@/shared/utils/rpc_utils";

export default function EventDetails() {
  const { eventId } = useParams<{
    eventId: string;
  }>();

  const [txnHash, setTxnHash] = useState<string | null>(null);
  const [eventIndex, setEventIndex] = useState<string | null>(null);
  const [eventData, setEventData] = useState([]);
  const [eventKeys, setEventKeys] = useState([]);
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    const [currentTxnHash, currentEventIndex] = eventId?.split("-") ?? [];
    setTxnHash(currentTxnHash);
    setEventIndex(currentEventIndex);
  }, [eventId]);

  const { isMobile } = useScreen();

  const { data: TransactionReceipt } = useQuery({
    queryKey: ["txn_receipt"],
    queryFn: () => RPC_PROVIDER.getTransactionReceipt(txnHash ?? "0"),
    enabled: !!txnHash,
  });

  const { data: BlockDetails } = useQuery({
    queryKey: ["txn_block_details"],
    queryFn: () => RPC_PROVIDER.getBlock(TransactionReceipt?.block_number),
    enabled: !!TransactionReceipt?.block_number,
  });

  const fetchEventDetails = useCallback(async () => {
    if (!txnHash || !eventIndex) return;

    const eventsData = TransactionReceipt?.events[Number(eventIndex)];
    setEvent(eventsData);

    const contract_abi = await RPC_PROVIDER.getClassAt(
      eventsData.from_address
    ).then((res) => res.abi);

    const eventsC = await RPC_PROVIDER.getEvents({
      address: eventsData.from_address,
      chunk_size: 100,
      keys: [eventsData.keys],
      from_block: {
        block_number: TransactionReceipt.block_number,
      },
      to_block: { block_number: TransactionReceipt.block_number },
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
      (e, index) => e.transaction_hash === TransactionReceipt.transaction_hash
    )?.[0];

    const currentEvent = eventDataMap;
    // should contain ":"
    const eventDataKey = Object.keys(currentEvent).filter((key) =>
      key.includes(":")
    );

    let eventKeyType = {};
    let eventDataType = {};

    // check in abi events objects if name = eventDataKey[0]
    Object.keys(abiEvents).forEach((key) => {
      if (abiEvents[key].name === eventDataKey[0]) {
        const eventInputType = abiEvents[key].members;

        // process the eventInputType
        eventInputType.forEach((input) => {
          if (input.kind === "key") {
            eventKeyType[input.name] = input.type;
          } else {
            eventDataType[input.name] = input.type;
          }
        });
      }
    });

    const result_key: { input: string; input_type: string; data: string }[] =
      [];
    const result_data: { input: string; input_type: string; data: string }[] =
      [];
    Object.keys(eventDataMap[eventDataKey[0]])?.forEach((key) => {
      if (eventKeyType[key]) {
        const finalData = {
          input: key,
          input_type: eventKeyType[key],
          data: convertToHex(eventDataMap[eventDataKey[0]][key]),
        };
        result_key.push(finalData);
      } else {
        const finalData = {
          input: key,
          input_type: eventDataType[key],
          data: convertToHex(eventDataMap[eventDataKey[0]][key]),
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

  return (
    <div className="flex flex-col w-full gap-8 px-2 py-4">
      <div className="flex flex-col w-full gap-4">
        <div>
          <h2>
            . / explrr / events /{" "}
            {isMobile && eventId ? truncateString(eventId) : eventId}
          </h2>
        </div>

        <div className="flex flex-row justify-between items-center uppercase bg-[#4A4A4A] px-4 py-2">
          <h1 className="text-white">Event Details</h1>
        </div>

        <div className="flex flex-col w-full lg:flex-row gap-4 pb-4">
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
                  Transaction Hash
                </p>
                <p>{isMobile && txnHash ? truncateString(txnHash) : txnHash}</p>
              </div>
              <div className="flex flex-col text-sm gap-1">
                <p className="w-fit font-bold px-2 py-1 bg-[#D9D9D9] text-black">
                  From Address
                </p>
                <p>
                  {isMobile && event?.from_address
                    ? truncateString(event.from_address)
                    : event?.from_address}
                </p>
              </div>
              <div className="flex flex-col text-sm gap-1">
                <p className="w-fit font-bold px-2 py-1 bg-[#D9D9D9] text-black">
                  Block Number
                </p>
                <p>{TransactionReceipt?.block_number}</p>
              </div>
              <div className="flex flex-col text-sm gap-1">
                <p className="w-fit font-bold px-2 py-1 bg-[#D9D9D9] text-black">
                  Timestamp
                </p>
                <p>
                  {BlockDetails?.timestamp} ({" "}
                  {dayjs
                    .unix(BlockDetails?.timestamp)
                    .format("MMM D YYYY HH:mm:ss")}{" "}
                  )
                </p>
              </div>
            </div>

            <div
              style={{
                borderTopStyle: "dashed",
                borderTopWidth: "2px",
              }}
              className="flex flex-col gap-4 p-4 border-[#8E8E8E] border-l-4 border-b border-r"
            >
              <div className="flex flex-col text-sm gap-1">
                <p className="w-fit font-bold px-2 py-1 bg-[#D9D9D9] text-black">
                  Keys
                </p>
                <div className="flex flex-col gap-2">
                  {event?.keys.length > 1 ? (
                    event?.keys.map(
                      (key, index) =>
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
              </div>
              <div className="flex flex-col text-sm gap-1">
                <p className="w-fit font-bold px-2 py-1 bg-[#D9D9D9] text-black">
                  Data
                </p>
                <div className="flex flex-col gap-2">
                  {event?.data.map((data, index) => (
                    <p key={index}> {isMobile ? truncateString(data) : data}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col w-full gap-2">
            <div className="flex flex-row justify-between bg-[#D9D9D9] items-center px-2 py-2 uppercase">
              <h1 className="text-black text-md font-bold">
                Selector: {event?.keys[0]}
              </h1>
            </div>
            <div className="flex flex-col w-full gap-4">
              {eventKeys.length > 0 ? (
                <div className="flex flex-col w-full gap-4">
                  <div className="flex flex-row justify-between items-center px-2 py-2 uppercase">
                    <h1 className="text-black text-lg font-bold">Keys</h1>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#D9D9D9] text-black">
                          <th className="px-4 py-2 text-left">Input</th>
                          <th className="px-4 py-2 text-left">Type</th>
                          <th className="px-4 py-2 text-left">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventKeys?.map((key, index) => {
                          return (
                            <tr
                              key={index}
                              className="border-b border-[#8E8E8E] border-dashed"
                            >
                              <td className="px-4 py-2">{key.input}</td>
                              <td className="px-4 py-2 break-all">
                                {key.input_type}
                              </td>
                              <td className="px-4 py-2 break-all">
                                {key.data}
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
                <div className="flex flex-col w-full gap-4">
                  <div className="flex flex-row justify-between items-center px-2 py-2 uppercase">
                    <h1 className="text-black text-lg font-bold">Data</h1>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#D9D9D9] text-black">
                          <th className="px-4 py-2 text-left">Input</th>
                          <th className="px-4 py-2 text-left">Type</th>
                          <th className="px-4 py-2 text-left">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventData?.map((key, index) => {
                          return (
                            <tr
                              key={index}
                              className="border-b border-[#8E8E8E] border-dashed"
                            >
                              <td className="px-4 py-2">{key.input}</td>
                              <td className="px-4 py-2 break-all">
                                {key.input_type}
                              </td>
                              <td className="px-4 py-2 break-all">
                                {key.data}
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
      </div>
    </div>
  );
}
