import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { isValidAddress } from "@/shared/utils/contract";
import { convertValue } from "@/shared/utils/rpc_utils";
import { isNumber } from "@/shared/utils/string";
import { EventDataItem } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  CallData,
  events,
  GetTransactionReceiptResponse,
  PendingBlock,
} from "starknet";

export function useEvent() {
  const { eventId } = useParams<{
    eventId: string;
  }>();
  const [txHash, eventIndex] = eventId?.split("-") ?? [];

  const { data, isLoading, error } = useQuery<{
    receipt?: GetTransactionReceiptResponse;
    block?: PendingBlock;
    event?: { from_address: string; keys: string[]; data: string[] };
    eventData: EventDataItem[];
    eventKeys: EventDataItem[];
  }>({
    queryKey: ["event", eventId],
    queryFn: async () => {
      if (!isValidAddress(txHash) || !isNumber(eventIndex)) {
        throw new Error("Invalid event id");
      }
      const receipt = await RPC_PROVIDER.getTransactionReceipt(txHash);
      if (!receipt) {
        throw new Error("Transaction receipt not found");
      }
      const block = await RPC_PROVIDER.getBlock(receipt?.block_number);

      const event = receipt?.events?.[eventIndex];

      if (!event) {
        throw new Error("Event not found");
      }

      const contract_abi = await RPC_PROVIDER.getClassAt(
        event.from_address,
      ).then((res) => res.abi);

      const eventsC = await RPC_PROVIDER.getEvents({
        address: event.from_address,
        chunk_size: 100,
        keys: [event.keys],
        from_block: {
          block_number: receipt?.block_number,
        },
        to_block: { block_number: receipt?.block_number },
      });
      const parsedEvent = events.parseEvents(
        eventsC.events,
        events.getAbiEvents(contract_abi),
        CallData.getAbiStruct(contract_abi),
        CallData.getAbiEnum(contract_abi),
      );

      if (!parsedEvent) {
        throw new Error("Events could not be parsed");
      }

      const eventDataMap = parsedEvent.filter(
        (e) => e.transaction_hash === receipt?.transaction_hash,
      )?.[0];

      if (!eventDataMap) {
        throw new Error("Event data map not found");
      }

      const currentEvent = eventDataMap;
      // should contain ":"
      const eventDataKey = Object.keys(currentEvent).filter((key) =>
        key.includes(":"),
      );

      const eventKeyType: Record<string, string> = {};
      const eventDataType: Record<string, string> = {};

      // check in abi events objects if name = eventDataKey[0]
      Object.keys(abiEvents).forEach((key) => {
        if (abiEvents[key].name === eventDataKey[0]) {
          const eventInputType = abiEvents[key].members;

          // process the eventInputType
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          eventInputType?.forEach((input: any) => {
            if (input.kind === "key") {
              eventKeyType[input.name] = input.type;
            } else {
              eventDataType[input.name] = input.type;
            }
          });
        }
      });

      const eventKeys: EventDataItem[] = [];
      const eventData: EventDataItem[] = [];
      Object.keys(eventDataMap[eventDataKey[0]])?.forEach((key) => {
        if (eventKeyType[key]) {
          const finalData: EventDataItem = {
            input: key,
            input_type: eventKeyType[key],
            data: convertValue(eventDataMap[eventDataKey[0]][key])?.hex || "",
          };
          eventKeys.push(finalData);
        } else {
          const finalData: EventDataItem = {
            input: key,
            input_type: eventDataType[key],
            data: convertValue(eventDataMap[eventDataKey[0]][key])?.hex || "",
          };
          eventData.push(finalData);
        }
      });

      return {
        receipt,
        block,
        event,
        eventData,
        eventKeys,
      };
    },
    retry: false,
  });
  return {
    data: {
      ...data,
      eventId,
      txHash,
    },
    isLoading,
    error,
  };
}
