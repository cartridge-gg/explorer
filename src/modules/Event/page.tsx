import { truncateString } from "@/shared/utils/string";
import { useScreen } from "@/shared/hooks/useScreen";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { convertValue } from "@/shared/utils/rpc";
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
  CardLabel,
  CardSeparator,
} from "@/shared/components/card";
import { PulseIcon, cn } from "@cartridge/ui";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/tabs";
import { CopyableInteger } from "@/shared/components/copyable-integer";
import FeltDisplayAsToggle from "@/shared/components/FeltDisplayAsToggle";

export function Event() {
  const {
    data: { eventId, txHash, receipt, block, event, decodedEvent },
    isLoading,
    error,
  } = useEvent();

  if (error) {
    console.error("Error fetching event", error);
  }

  const { isMobile } = useScreen();

  const [formats, setFormats] = useState<{
    rawKeys: DisplayFormatTypes;
    rawData: DisplayFormatTypes;
    decodedKeys: DisplayFormatTypes;
    decodedData: DisplayFormatTypes;
  }>({
    rawKeys: "hex",
    rawData: "hex",
    decodedKeys: "hex",
    decodedData: "hex",
  });

  const [activeTab, setActiveTab] = useState<"raw" | "decoded">("raw");

  const hasRawKeys = event?.keys.length > 0;
  const hasRawData = event?.data.length > 0;
  const hasDecodedKeys = Boolean(decodedEvent?.keys?.length);
  const hasDecodedData = Boolean(decodedEvent?.data?.length);
  const hasDecoded = Boolean(
    decodedEvent && (hasDecodedKeys || hasDecodedData),
  );

  useEffect(() => {
    if (!hasDecoded && activeTab === "decoded") {
      setActiveTab("raw");
    }
  }, [hasDecoded, activeTab]);

  const renderValue = (value: string, format: DisplayFormatTypes) =>
    convertValue(value)?.[format] ?? value;

  return (
    <div className="w-full flex flex-col gap-[3px] sl:w-[1134px]">
      <Breadcrumb className="mb-[7px]">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="..">Explorer</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Events</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-foreground-400 text-[12px]/[16px] font-normal">
              {isMobile && eventId ? truncateString(eventId) : eventId}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        containerClassName="rounded-t-[12px] rounded-b-sm"
        className="px-[15px] py-[8px]"
      >
        <PageHeaderTitle className="gap-[12px]">
          <PulseIcon variant="solid" />
          <h1 className="text-[14px]/[20px] font-medium">Event</h1>
        </PageHeaderTitle>
      </PageHeader>

      {isLoading || (!error && !block) ? (
        <Loading />
      ) : error ? (
        <NotFound />
      ) : (
        <div className="flex flex-col sl:flex-row sl:h-[73vh] gap-[3px]">
          <div className="sl:min-w-[337px] flex flex-col gap-[3px] sl:overflow-y-scroll">
            <Card className="rounded-sm p-0">
              <CardContent className="py-[12px] px-[15px] gap-[18px]">
                <div className="flex flex-col gap-[6px]">
                  <CardLabel>Transaction</CardLabel>
                  <CopyableInteger
                    title="Transaction Hash"
                    value={txHash}
                    length={isMobile ? 1 : 3}
                    to={txHash ? `/tx/${txHash}` : undefined}
                  />
                </div>

                <div className="flex flex-col gap-[6px]">
                  <CardLabel>From</CardLabel>
                  <CopyableInteger
                    title="Contract Address"
                    value={event?.from_address}
                    length={isMobile ? 1 : 3}
                    to={
                      event?.from_address
                        ? `/contract/${event.from_address}`
                        : undefined
                    }
                  />
                </div>

                <div className="flex flex-col gap-[4px]">
                  <CardLabel>Block</CardLabel>
                  <span className="text-[13px] font-medium text-foreground">
                    {receipt?.block_number ?? "—"}
                  </span>
                </div>

                <div className="flex flex-col gap-[4px]">
                  <CardLabel>Event Type</CardLabel>
                  <span className="text-[13px] font-medium text-foreground">
                    {decodedEvent?.qualifiedName ?? "—"}
                  </span>
                </div>

                <div className="flex flex-col gap-[4px]">
                  <CardLabel>Timestamp</CardLabel>
                  <span className="text-[13px] font-medium text-foreground">
                    {block?.timestamp
                      ? dayjs
                          .unix(block.timestamp || 0)
                          .format("MMM D YYYY HH:mm:ss")
                      : "Loading..."}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 flex flex-col gap-[3px] sl:overflow-y-scroll">
            <Card className="rounded-sm p-0 h-full">
              <Tabs
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab((value as "raw" | "decoded") ?? "raw")
                }
                className="flex flex-col h-full"
              >
                <div className="px-[15px] pt-[10px] pb-[6px]">
                  <TabsList className="gap-[12px] p-0 h-8">
                    <TabsTrigger
                      value="raw"
                      className={cn(
                        "data-[state=active]:border-primary data-[state=active]:text-primary text-[12px]/[18px] uppercase tracking-[0.24px]",
                      )}
                    >
                      Raw
                    </TabsTrigger>
                    <TabsTrigger
                      value="decoded"
                      disabled={!hasDecoded}
                      className={cn(
                        "data-[state=active]:border-primary data-[state=active]:text-primary text-[12px]/[18px] uppercase tracking-[0.24px]",
                        !hasDecoded && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      Decoded
                    </TabsTrigger>
                  </TabsList>
                </div>
                <CardSeparator className="m-0" />
                <TabsContent value="raw" className="mt-0 flex-1 overflow-auto">
                  <div className="px-[15px] py-[15px] flex flex-col gap-[20px] text-foreground">
                    <section className="flex flex-col gap-[10px]">
                      <div className="flex items-center justify-between gap-[12px]">
                        <CardLabel className="uppercase whitespace-nowrap">
                          Keys
                        </CardLabel>
                        {hasRawKeys ? (
                          <FeltDisplayAsToggle
                            asString
                            displayAs={formats.rawKeys}
                            onChange={(format) =>
                              setFormats((prev) => ({
                                ...prev,
                                rawKeys: format,
                              }))
                            }
                          />
                        ) : null}
                      </div>

                      {hasRawKeys ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-separate border-spacing-y-[6px] text-left">
                            <thead className="text-[11px] uppercase text-foreground-400">
                              <tr>
                                <th className="px-[10px] py-[6px] font-medium">
                                  Index
                                </th>
                                <th className="px-[10px] py-[6px] font-medium">
                                  Value
                                </th>
                              </tr>
                            </thead>
                            <tbody className="text-[13px] text-foreground">
                              {event?.keys.map(
                                (value: string, index: number) => {
                                  const format = formats.rawKeys ?? "hex";
                                  return (
                                    <tr
                                      key={`raw-key-${index}`}
                                      className="bg-background-200 rounded-sm"
                                    >
                                      <td className="px-[10px] py-[6px] align-top font-medium text-foreground-300">
                                        {index}
                                      </td>
                                      <td className="px-[10px] py-[6px] font-mono break-all">
                                        {renderValue(value, format)}
                                      </td>
                                    </tr>
                                  );
                                },
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-[12px] text-foreground-300">
                          No raw keys found.
                        </p>
                      )}
                    </section>

                    <CardSeparator className="my-0" />

                    <section className="flex flex-col gap-[10px]">
                      <div className="flex items-center justify-between gap-[12px]">
                        <CardLabel className="uppercase whitespace-nowrap">
                          Data
                        </CardLabel>
                        {hasRawData ? (
                          <FeltDisplayAsToggle
                            asString
                            displayAs={formats.rawData}
                            onChange={(format) =>
                              setFormats((prev) => ({
                                ...prev,
                                rawData: format,
                              }))
                            }
                          />
                        ) : null}
                      </div>

                      {hasRawData ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-separate border-spacing-y-[6px] text-left">
                            <thead className="text-[11px] uppercase text-foreground-400">
                              <tr>
                                <th className="px-[10px] py-[6px] font-medium">
                                  Index
                                </th>
                                <th className="px-[10px] py-[6px] font-medium">
                                  Value
                                </th>
                              </tr>
                            </thead>
                            <tbody className="text-[13px] text-foreground">
                              {event?.data.map(
                                (value: string, index: number) => {
                                  const format = formats.rawData ?? "hex";
                                  return (
                                    <tr
                                      key={`raw-data-${index}`}
                                      className="bg-background-200 rounded-sm"
                                    >
                                      <td className="px-[10px] py-[6px] align-top font-medium text-foreground-300">
                                        {index}
                                      </td>
                                      <td className="px-[10px] py-[6px] font-mono break-all">
                                        {renderValue(value, format)}
                                      </td>
                                    </tr>
                                  );
                                },
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-[12px] text-foreground-300">
                          No raw data found.
                        </p>
                      )}
                    </section>
                  </div>
                </TabsContent>

                {hasDecoded ? (
                  <TabsContent
                    value="decoded"
                    className="mt-0 flex-1 overflow-auto"
                  >
                    {/* TODO: handle the nested events without flat, where the selector could be composed of multiple felts. */}
                    <section className="px-[15px] py-[15px]">
                      <div className="flex items-center justify-between">
                        <CardLabel className="uppercase">Selector</CardLabel>
                        <span className="font-mono text-[12px] text-foreground-300 break-all">
                          {decodedEvent.name}
                        </span>
                        <CopyableInteger
                          title={decodedEvent.name}
                          value={event?.keys?.[0] ?? "—"}
                          length={isMobile ? 1 : 3}
                          to={undefined}
                        />
                      </div>
                    </section>

                    <div className="px-[15px] py-[15px] flex flex-col gap-[20px] text-foreground">
                      {hasDecodedKeys ? (
                        <section className="flex flex-col gap-[10px]">
                          <div className="flex items-center justify-between gap-[12px]">
                            <CardLabel className="uppercase whitespace-nowrap">
                              Decoded Keys
                            </CardLabel>
                            <FeltDisplayAsToggle
                              asString
                              displayAs={formats.decodedKeys}
                              onChange={(format) =>
                                setFormats((prev) => ({
                                  ...prev,
                                  decodedKeys: format,
                                }))
                              }
                            />
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full border-separate border-spacing-y-[6px] text-left">
                              <thead className="text-[11px] uppercase text-foreground-400">
                                <tr>
                                  <th className="px-[10px] py-[6px] font-medium">
                                    Input
                                  </th>
                                  <th className="px-[10px] py-[6px] font-medium">
                                    Type
                                  </th>
                                  <th className="px-[10px] py-[6px] font-medium">
                                    Value
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="text-[13px] text-foreground">
                                {decodedEvent?.keys.map((key, index) => {
                                  const format = formats.decodedKeys ?? "hex";
                                  return (
                                    <tr
                                      key={`decoded-key-${key.input}-${index}`}
                                      className="bg-background-200 rounded-sm"
                                    >
                                      <td className="px-[10px] py-[6px] font-medium">
                                        {key.input}
                                      </td>
                                      <td className="px-[10px] py-[6px] font-mono text-foreground-300 break-all">
                                        {key.input_type}
                                      </td>
                                      <td className="px-[10px] py-[6px] font-mono break-all">
                                        {renderValue(key.data, format)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      ) : null}

                      {hasDecodedKeys && hasDecodedData ? (
                        <CardSeparator className="my-0" />
                      ) : null}

                      {hasDecodedData ? (
                        <section className="flex flex-col gap-[10px]">
                          <div className="flex items-center justify-between gap-[12px]">
                            <CardLabel className="uppercase whitespace-nowrap">
                              Decoded Data
                            </CardLabel>
                            <FeltDisplayAsToggle
                              asString
                              displayAs={formats.decodedData}
                              onChange={(format) =>
                                setFormats((prev) => ({
                                  ...prev,
                                  decodedData: format,
                                }))
                              }
                            />
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full border-separate border-spacing-y-[6px] text-left">
                              <thead className="text-[11px] uppercase text-foreground-400">
                                <tr>
                                  <th className="px-[10px] py-[6px] font-medium">
                                    Input
                                  </th>
                                  <th className="px-[10px] py-[6px] font-medium">
                                    Type
                                  </th>
                                  <th className="px-[10px] py-[6px] font-medium">
                                    Value
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="text-[13px] text-foreground">
                                {decodedEvent?.data.map((item, index) => {
                                  const format = formats.decodedData ?? "hex";
                                  return (
                                    <tr
                                      key={`decoded-data-${item.input}-${index}`}
                                      className="bg-background-200 rounded-sm"
                                    >
                                      <td className="px-[10px] py-[6px] font-medium">
                                        {item.input}
                                      </td>
                                      <td className="px-[10px] py-[6px] font-mono text-foreground-300 break-all">
                                        {item.input_type}
                                      </td>
                                      <td className="px-[10px] py-[6px] font-mono break-all">
                                        {renderValue(item.data, format)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </section>
                      ) : null}
                    </div>
                  </TabsContent>
                ) : (
                  <TabsContent
                    value="decoded"
                    className="mt-0 flex-1 flex items-center justify-center text-foreground-300 text-[12px]"
                  >
                    No decoded event available for this entry.
                  </TabsContent>
                )}
              </Tabs>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
