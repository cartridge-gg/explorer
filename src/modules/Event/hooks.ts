import { RPC_PROVIDER } from "@/services/rpc";
import { isValidAddress } from "@/shared/utils/contract";
import { EventDataItem } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  AbiParser2,
  CallData,
  events,
  SuccessfulTransactionReceiptResponse,
} from "starknet";

type AbiEventMember = {
  name: string;
  type: string;
  kind: "key" | "data";
};

type AbiEventInput =
  | AbiEventMember
  | {
      name: string;
      type: string;
      indexed?: boolean;
      kind?: "key" | "data";
    };

type RawEventForParser =
  SuccessfulTransactionReceiptResponse["events"][number] & {
    block_number: number;
    block_hash: string;
    transaction_hash: string;
  };

type BlockResponse = {
  block_number?: number;
  block_hash?: string;
  timestamp?: number;
  [key: string]: unknown;
};

type RawField = {
  index: number;
  value: string;
  name?: string;
  type?: string;
};

type DecodedEventDetails = {
  name: string;
  qualifiedName: string;
  keys: EventDataItem[];
  data: EventDataItem[];
};

type UseEventQueryResult = {
  receipt: SuccessfulTransactionReceiptResponse;
  block: BlockResponse;
  event: SuccessfulTransactionReceiptResponse["events"][number];
  eventData: EventDataItem[];
  eventKeys: EventDataItem[];
  rawKeys: RawField[];
  rawData: RawField[];
  decodedEvent: DecodedEventDetails | null;
};

export function useEvent() {
  const { eventId } = useParams<{
    eventId: string;
  }>();
  const [txHash, eventIndexStr] = eventId?.split("-") ?? [];
  const eventIndex = parseInt(eventIndexStr, 10);

  const { data, isLoading, error } = useQuery<UseEventQueryResult>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      if (!isValidAddress(txHash) || isNaN(eventIndex) || eventIndex < 0) {
        throw new Error("Invalid event id");
      }
      const receiptResponse = await RPC_PROVIDER.getTransactionReceipt(txHash);

      // Type guard to ensure we have a successful receipt
      if (!receiptResponse || !("block_number" in receiptResponse)) {
        throw new Error("Transaction receipt not found or is invalid");
      }

      const receipt = receiptResponse as SuccessfulTransactionReceiptResponse;

      const block = (await RPC_PROVIDER.getBlock(
        receipt.block_number,
      )) as BlockResponse;

      const event = receipt?.events?.[eventIndex];

      if (!event) {
        throw new Error("Event not found");
      }

      const contract_abi = await RPC_PROVIDER.getClassAt(
        event.from_address,
      ).then((res) => res.abi);

      // Avoid fetching again the event...
      // Construct event with proper structure for parseEvents
      const blockNumber = "block_number" in block ? block.block_number : 0;
      const blockHash = "block_hash" in block ? block.block_hash : "";

      const eventsC: RawEventForParser[] = [
        {
          block_number: blockNumber,
          block_hash: blockHash || "0x0",
          transaction_hash: txHash,
          ...event,
        },
      ];

      const parser = new AbiParser2(contract_abi);
      const abiEvents = events.getAbiEvents(contract_abi);

      const parsedEvent = events.parseEvents(
        eventsC,
        abiEvents,
        CallData.getAbiStruct(contract_abi),
        CallData.getAbiEnum(contract_abi),
        parser,
      );

      let decodedEventName = "";
      let decodedEventQualifiedName = "";
      const eventKeys: EventDataItem[] = [];
      const eventData: EventDataItem[] = [];
      const rawKeyDefinitions: Array<{ name?: string; type?: string }> = [];
      const rawDataDefinitions: Array<{ name?: string; type?: string }> = [];

      if (parsedEvent && parsedEvent.length > 0) {
        const eventDataMap = parsedEvent.find(
          (e) => e.transaction_hash === receipt?.transaction_hash,
        );

        if (eventDataMap) {
          const qualifiedName = Object.keys(eventDataMap).find((key) =>
            key.includes("::"),
          );

          if (qualifiedName) {
            decodedEventQualifiedName = qualifiedName;
            decodedEventName =
              qualifiedName.split("::").pop() ?? qualifiedName ?? "";

            const eventKeyType: Record<string, string> = {};
            const eventDataType: Record<string, string> = {};

            const registerKey = (input: AbiEventInput) => {
              const { name, type } = input;
              if (!type) {
                return;
              }
              rawKeyDefinitions.push({ name, type });
              if (name) {
                eventKeyType[name] = type;
              } else {
                eventKeyType[`key_${rawKeyDefinitions.length - 1}`] = type;
              }
            };

            const registerData = (input: AbiEventInput) => {
              const { name, type } = input;
              if (!type) {
                return;
              }
              rawDataDefinitions.push({ name, type });
              if (name) {
                eventDataType[name] = type;
              } else {
                eventDataType[`data_${rawDataDefinitions.length - 1}`] = type;
              }
            };

            Object.keys(abiEvents).forEach((key) => {
              const abiEvent = abiEvents[key];
              if ("name" in abiEvent && abiEvent.name === decodedEventName) {
                if ("members" in abiEvent && Array.isArray(abiEvent.members)) {
                  (abiEvent.members as AbiEventMember[]).forEach((input) => {
                    if (input.kind === "key") {
                      registerKey(input);
                    } else {
                      registerData(input);
                    }
                  });
                }

                if ("keys" in abiEvent && Array.isArray(abiEvent.keys)) {
                  (abiEvent.keys as AbiEventInput[]).forEach(registerKey);
                }

                if ("data" in abiEvent && Array.isArray(abiEvent.data)) {
                  (abiEvent.data as AbiEventInput[]).forEach(registerData);
                }

                if ("inputs" in abiEvent && Array.isArray(abiEvent.inputs)) {
                  (abiEvent.inputs as AbiEventInput[]).forEach((input) => {
                    const isKey =
                      input.kind === "key" ||
                      (typeof input.indexed === "boolean" && input.indexed);
                    if (isKey) {
                      registerKey(input);
                    } else {
                      registerData(input);
                    }
                  });
                }
              }
            });

            const decodedEventData = eventDataMap[qualifiedName];
            const stringify = (value: unknown) => {
              if (typeof value === "bigint") {
                return `0x${value.toString(16)}`;
              }
              if (Array.isArray(value)) {
                return `[${value.map((item) => stringify(item)).join(", ")}]`;
              }
              if (typeof value === "object" && value !== null) {
                return JSON.stringify(
                  Object.fromEntries(
                    Object.entries(value).map(([k, v]) => [k, stringify(v)]),
                  ),
                );
              }
              return String(value);
            };

            let keyPosition = 0;
            let dataPosition = 0;

            Object.entries(decodedEventData || {}).forEach(([key, value]) => {
              const readableValue = stringify(value);
              const isKey = key in eventKeyType;

              if (isKey) {
                const fallback = rawKeyDefinitions[keyPosition];
                const inputType =
                  eventKeyType[key] ??
                  fallback?.type ??
                  eventDataType[key] ??
                  "unknown";
                const inputName = key || fallback?.name || `key_${keyPosition}`;
                eventKeys.push({
                  input: inputName,
                  input_type: inputType,
                  data: readableValue,
                });
                keyPosition += 1;
              } else {
                const fallback = rawDataDefinitions[dataPosition];
                const inputType =
                  eventDataType[key] ??
                  fallback?.type ??
                  eventKeyType[key] ??
                  "unknown";
                const inputName =
                  key || fallback?.name || `data_${dataPosition}`;
                eventData.push({
                  input: inputName,
                  input_type: inputType,
                  data: readableValue,
                });
                dataPosition += 1;
              }
            });
          }
        }
      }

      return {
        receipt,
        block,
        event,
        eventData,
        eventKeys,
        rawKeys: event.keys?.map((value, index) => ({
          index,
          value,
          name: rawKeyDefinitions[index]?.name,
          type: rawKeyDefinitions[index]?.type,
        })),
        rawData: event.data?.map((value, index) => ({
          index,
          value,
          name: rawDataDefinitions[index]?.name,
          type: rawDataDefinitions[index]?.type,
        })),
        decodedEvent: decodedEventName
          ? {
              name: decodedEventName,
              qualifiedName: decodedEventQualifiedName,
              keys: eventKeys,
              data: eventData,
            }
          : null,
      };
    },
    retry: false,
    enabled: !!eventId, // Only run query if eventId exists
  });
  
  return {
    data: {
      eventId,
      txHash,
      receipt: data?.receipt,
      block: data?.block,
      event: data?.event,
      eventData: data?.eventData ?? [],
      eventKeys: data?.eventKeys ?? [],
      rawKeys: data?.rawKeys ?? [],
      rawData: data?.rawData ?? [],
      decodedEvent: data?.decodedEvent ?? null,
    },
    isLoading,
    error,
  };
}
