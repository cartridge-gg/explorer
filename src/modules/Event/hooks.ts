import { RPC_PROVIDER } from "@/services/rpc";
import { sortedAbi, AbiEventMember } from "@/shared/utils/abi";
import { isValidAddress } from "@/shared/utils/contract";
import { stringifyData } from "@/shared/utils/string";
import { EventDataItem } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  AbiParser2,
  CallData,
  events,
  SuccessfulTransactionReceiptResponse,
  EmittedEvent,
} from "starknet";

type BlockResponse = {
  block_number?: number;
  block_hash?: string;
  timestamp?: number;
  [key: string]: unknown;
};

// TODO: Depending on the ABI, events may come with the `flat` attribute.
// If this attribute is present, then the selector is actually composed of multiple
// felts which are the first n keys depending on the nested structure.
// Otherwise, the selector is the first key of the event.
// We should handle that to correctly show the selectors in the UI.
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

      // Since the event is indexed from the transaction receipt index,
      // this fetch is mandatory.
      const receiptResponse = await RPC_PROVIDER.getTransactionReceipt(txHash);

      if (!receiptResponse) {
        throw new Error("Transaction receipt not found or is invalid");
      }

      const receipt = receiptResponse as SuccessfulTransactionReceiptResponse;

      // The block is mostly required for its timestamp.
      const block = (await RPC_PROVIDER.getBlock(
        receipt.block_number,
      )) as BlockResponse;

      if (eventIndex > receipt?.events?.length) {
        throw new Error("Event index out of range");
      }

      const event = receipt?.events?.[eventIndex];
      if (!event) {
        throw new Error("Event not found");
      }

      const contract_abi = sortedAbi(
        await RPC_PROVIDER.getClassAt(event.from_address).then(
          (res) => res.abi,
        ),
      );

      // We can rebuild the `EmittedEvent` instead of fetching again from the chain.
      const eventsC: EmittedEvent[] = [
        {
          block_number: receipt?.block_number ?? 0,
          block_hash: receipt?.block_hash ?? "0x0",
          transaction_hash: txHash,
          ...event,
        },
      ];

      const abiEvents = events.getAbiEvents(contract_abi);

      // `parseEvents` returns an array. However, we only have one event,
      // which we can extract by taking the first element.
      const parsedEvent = events.parseEvents(
        eventsC,
        abiEvents,
        CallData.getAbiStruct(contract_abi),
        CallData.getAbiEnum(contract_abi),
        new AbiParser2(contract_abi),
      )[0];

      let decodedEventName = "";
      let decodedEventQualifiedName = "";
      // The final output of the event data, where lives the
      // event's member data, name and type.
      const eventKeys: EventDataItem[] = [];
      const eventData: EventDataItem[] = [];
      // The raw definitions map the member index to the name and type.
      const rawKeyDefinitions: Array<{ name: string; type?: string }> = [];
      const rawDataDefinitions: Array<{ name: string; type: string }> = [];

      if (parsedEvent) {
        // When decoded, the events object has a key with the full cairo path,
        // like dojo::world::world_contract::world::ContractInitialized.
        // To extract it, we consider this is the only key including "::".
        const qualifiedName = Object.keys(parsedEvent).find((key) =>
          key.includes("::"),
        );

        if (qualifiedName) {
          decodedEventQualifiedName = qualifiedName;
          decodedEventName =
            qualifiedName.split("::").pop() ?? qualifiedName ?? "";

          // Iterate on all the ABI's events to find the one currently parsed,
          // by using the qualified name which should be unique across the cairo project.
          Object.keys(abiEvents).forEach((key) => {
            const abiEvent = abiEvents[key];
            if (
              "name" in abiEvent &&
              abiEvent.name === decodedEventQualifiedName
            ) {
              if ("members" in abiEvent && Array.isArray(abiEvent.members)) {
                (abiEvent.members as AbiEventMember[]).forEach(
                  ({ name, type, kind }: AbiEventMember) => {
                    if (kind === "key") {
                      rawKeyDefinitions.push({ name, type });
                    } else {
                      rawDataDefinitions.push({ name, type });
                    }
                  },
                );
              }
            }
          });

          const decodedEventData = parsedEvent[qualifiedName];

          rawKeyDefinitions.forEach(({ name, type }, index) => {
            eventKeys.push({
              input: name ?? `key_${index}`,
              input_type: type ?? "unknown",
              data: stringifyData(decodedEventData[name]),
            });
          });

          rawDataDefinitions.forEach(({ name, type }) => {
            eventData.push({
              input: name,
              input_type: type,
              data: stringifyData(decodedEventData[name]),
            });
          });
        }
      }

      return {
        receipt,
        block,
        event,
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
      decodedEvent: data?.decodedEvent ?? null,
    },
    isLoading,
    error,
  };
}
