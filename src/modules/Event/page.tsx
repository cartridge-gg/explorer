import { truncateString } from "@/shared/utils/string";
import { useScreen } from "@/shared/hooks/useScreen";
import dayjs from "dayjs";
import { useState } from "react";
import { convertValue } from "@/shared/utils/rpc_utils";
import { DisplayFormatTypes } from "@/types/types";
import { PageHeader, PageHeaderTitle } from "@/shared/components/PageHeader";
import { useEvent } from "./hooks";
import { Loading } from "@/shared/components/Loading";
import { NotFound } from "../NotFound/page";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/breadcrumb";
import {
  Card,
  CardContent,
  CardHeader,
  CardLabel,
  CardSeparator,
  CardTitle,
} from "@/shared/components/card";
import { PulseIcon } from "@cartridge/ui";

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
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="..">Explorer</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Events</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {isMobile && eventId ? truncateString(eventId) : eventId}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader>
        <PageHeaderTitle>
          <PulseIcon variant="solid" />
          <div>Event Details</div>
        </PageHeaderTitle>
      </PageHeader>

      <div className="flex flex-col sl:flex-row gap-4">
        <div className="flex w-full sl:w-[35%] sl:min-w-[35%] sl:max-w-[35%] flex-col gap-4 sl:overflow-y-auto">
          <Card>
            <CardContent>
              <div className="flex justify-between gap-2">
                <CardLabel>Transaction Hash</CardLabel>
                <div>
                  {isMobile && txHash ? truncateString(txHash) : txHash}
                </div>
              </div>

              <div className="flex justify-between gap-2">
                <CardLabel>From Address</CardLabel>
                <div>
                  {isMobile && event?.from_address
                    ? truncateString(event.from_address)
                    : event?.from_address}
                </div>
              </div>

              <div className="flex justify-between gap-2">
                <CardLabel>Block Number</CardLabel>
                <div>{receipt?.block_number}</div>
              </div>

              <div className="flex justify-between gap-2">
                <CardLabel>Timestamp</CardLabel>
                <div>
                  {block?.timestamp
                    ? `${block.timestamp} (${dayjs
                        .unix(block.timestamp || 0)
                        .format("MMM D YYYY HH:mm:ss")})`
                    : "Loading..."}
                </div>
              </div>
            </CardContent>

            <CardSeparator />

            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex justify-between gap-2">
                <CardLabel>Keys</CardLabel>
                <div>
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
              </div>

              <div className="flex justify-between gap-2">
                <CardLabel>Data</CardLabel>
                <div className="flex flex-col gap-2 overflow-hidden">
                  {event?.data?.map((data: string, index: number) => (
                    <p key={index} className="break-all">
                      {isMobile ? truncateString(data) : data}
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
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
