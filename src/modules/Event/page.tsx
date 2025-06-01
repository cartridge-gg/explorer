import { truncateString } from "@/shared/utils/string";
import { useScreen } from "@/shared/hooks/useScreen";
import dayjs from "dayjs";
import { useState } from "react";
import { convertValue } from "@/shared/utils/rpc_utils";
import { DisplayFormatTypes } from "@/types/types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbSeparator,
} from "@/shared/components/breadcrumbs";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionBox } from "@/shared/components/section/SectionBox";
import { SectionBoxEntry } from "@/shared/components/section";
import { useEvent } from "./hooks";
import { Loading } from "@/shared/components/Loading";
import { NotFound } from "../NotFound/page";

const DisplayFormat = ["hex", "dec", "string"] as const;

export function Event() {
  const {
    data: { eventId, txHash, receipt, block, event, eventData, eventKeys },
    isLoading,
    error,
  } = useEvent();
  const { isMobile } = useScreen();

  const [formats, setFormats] = useState<{
    keys: DisplayFormatTypes;
    data: DisplayFormatTypes;
  }>({ keys: "hex", data: "hex" });

  if (isLoading || (!error && (!block || !event))) {
    return <Loading />;
  }

  if (error) {
    return <NotFound />;
  }

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
            {dayjs.unix(block?.timestamp).format("MMM D YYYY HH:mm:ss")}{" "}
          </div>
        }
      />

      <div className="flex flex-col sl:flex-row gap-4">
        <div className="flex w-full sl:w-[35%] sl:min-w-[35%] sl:max-w-[35%] flex-col gap-4 sl:overflow-y-auto">
          <SectionBox>
            <SectionBoxEntry title="Transaction Hash">
              {isMobile && txHash ? truncateString(txHash) : txHash}
            </SectionBoxEntry>

            <SectionBoxEntry title="From Address">
              {isMobile && event?.from_address
                ? truncateString(event.from_address)
                : event?.from_address}
            </SectionBoxEntry>

            <SectionBoxEntry title="Block Number">
              {receipt?.block_number}
            </SectionBoxEntry>

            <SectionBoxEntry title="Timestamp">
              {block?.timestamp
                ? `${block.timestamp} (${dayjs
                    .unix(block.timestamp || 0)
                    .format("MMM D YYYY HH:mm:ss")})`
                : "Loading..."}
            </SectionBoxEntry>
          </SectionBox>

          <SectionBox title="Event Details">
            <SectionBoxEntry title="Keys">
              <div className="flex flex-col gap-2">
                {event?.keys?.length > 1 ? (
                  event.keys.map(
                    (key: string, index: number) =>
                      index !== 0 && (
                        <p key={index}>
                          {isMobile ? truncateString(key) : key}
                        </p>
                      ),
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
          {eventKeys?.length && eventKeys?.length > 0 ? (
            <div className="flex flex-col w-full gap-4 border rounded-md p-4">
              <div className="flex flex-row justify-between items-center px-2 py-2 uppercase">
                <h1 className="text-black text-lg font-bold">Event Keys</h1>
                <div className="flex gap-2">
                  {DisplayFormat.map((format) => (
                    <button
                      key={format}
                      className={`px-2 py-1 text-xs ${
                        (formats.keys ?? "hex") === format
                          ? "bg-[#4A4A4A] text-white"
                          : "bg-gray-200"
                      }`}
                      onClick={() =>
                        setFormats((prev) => ({
                          ...prev,
                          keys: format,
                        }))
                      }
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
                      const format = formats.keys ?? "hex";
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
                              {convertValue(key.data)?.[format] ?? key.data}
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
                      className={`px-2 py-1 text-xs ${
                        (formats.data ?? "hex") === format
                          ? "bg-[#4A4A4A] text-white"
                          : "bg-gray-200"
                      }`}
                      onClick={() =>
                        setFormats((prev) => ({
                          ...prev,
                          data: format,
                        }))
                      }
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
                      const format = formats.data ?? "hex";
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
                              {convertValue(item.data)?.[format] ?? item.data}
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
