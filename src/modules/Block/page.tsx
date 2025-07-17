import { cairo } from "starknet";
import { formatFri } from "@/shared/utils/fri";
import { formatWei } from "@/shared/utils/wei";
import {
  GasIcon,
  StackDiamondIcon,
  cn,
  Skeleton,
  ListIcon,
  PulseIcon,
  WedgeIcon,
} from "@cartridge/ui";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent as CardContentOld,
  CardLabel,
  CardSeparator,
  ExecutionResourcesCard,
} from "@/shared/components/card";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/shared/components/breadcrumb";
import {
  PageHeader,
  PageHeaderRight,
  PageHeaderTitle,
} from "@/shared/components/PageHeader";
import { NotFound } from "../NotFound/page";
import { useHashLinkTabs } from "@/shared/hooks/useHashLinkTabs";
import { useBlock } from "./hooks";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/tabs";
import { CopyableInteger } from "@/shared/components/copyable-integer";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useBlockNumber } from "@/shared/hooks/useBlockNumber";
import dayjs from "dayjs";
import { getFinalityStatus } from "@/shared/utils/receipt";
import { Badge } from "@/shared/components/badge";
import { DataTable } from "@/shared/components/data-table";
import { MultiFilter } from "@/shared/components/filter";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { truncateString } from "@/shared/utils/string";
import { useScreen } from "@/shared/hooks/useScreen";

const TXN_OFFSET = 150; // Offset for the transaction table
const EVENT_OFFSET = 100; // Offset for the event table

export function Block() {
  const tab = useHashLinkTabs("transactions");
  const { hash } = useLocation();
  const navigate = useNavigate();
  const { isMobile } = useScreen();
  const rowHeight = 35;
  const [tableContainerHeight, setTableContainerHeight] = useState(0);

  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = tableContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { height } = entry.contentRect;
        setTableContainerHeight(Math.max(height, 0)); // Ensure non-negative
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const txnItemPerPage = useMemo(() => {
    if (isMobile) return 5;

    if (tableContainerHeight > 0) {
      const calculatedHeight = tableContainerHeight - TXN_OFFSET;
      return Math.max(1, Math.floor(calculatedHeight / rowHeight));
    }
    return undefined;
  }, [tableContainerHeight, isMobile]);

  const eventsItemPerPage = useMemo(() => {
    if (isMobile) return 5;

    if (tableContainerHeight > 0) {
      const calculatedHeight = tableContainerHeight - EVENT_OFFSET;
      return Math.max(1, Math.floor(calculatedHeight / rowHeight));
    }
    return undefined;
  }, [tableContainerHeight, isMobile]);

  const {
    data: { blockId, block, txs, events, executions, blockComputeData },
    error,
  } = useBlock({
    txnPageSize: txnItemPerPage,
    eventPageSize: eventsItemPerPage,
    enabled: !!txnItemPerPage && !!eventsItemPerPage,
  });
  const { blockNumber: latestBlockNumber } = useBlockNumber();

  const isLatestBlock = useMemo(() => {
    return (
      latestBlockNumber !== undefined &&
      block?.block_number >= Number(latestBlockNumber)
    );
  }, [latestBlockNumber, block?.block_number]);

  const onClickSequencerAddress = useCallback(() => {
    navigate(`../contract/${block?.sequencer_address}`);
  }, [block?.sequencer_address, navigate]);

  const onCopyValue = useCallback((value: string | undefined) => {
    if (!value) return;

    navigator.clipboard.writeText(value);
    toast.success("Value copied to clipboard");
  }, []);

  return (
    <div className="w-full flex flex-col gap-[4px] sl:w-[1134px]">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="..">Explorer</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="../blocks">Blocks</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {blockId ? (
              <BreadcrumbPage className="text-foreground-400 text-[12px]/[16px] font-normal">
                {isMobile && blockId ? truncateString(blockId) : blockId}
              </BreadcrumbPage>
            ) : (
              <Skeleton className="h-4 w-[400px] rounded-sm" />
            )}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        containerClassName="rounded-t-[12px] rounded-b-sm"
        className="px-[15px] py-[8px]"
      >
        <PageHeaderTitle>
          <StackDiamondIcon variant="solid" />
          Block{" "}
          {block ? (
            block.block_number
          ) : (
            <Skeleton className="h-4 w-6 rounded-sm" />
          )}
        </PageHeaderTitle>

        <PageHeaderRight>
          <Link
            className={cn(
              "bg-background border-l border-background-200 text-foreground size-12 flex items-center justify-center cursor-pointer hover:bg-background-200",
              !block?.block_number &&
                "cursor-not-allowed pointer-events-none text-foreground-300",
            )}
            to={{
              pathname: `../block/${block?.block_number - 1}`,
              hash,
            }}
          >
            <WedgeIcon variant="left" />
          </Link>
          <Link
            className={cn(
              "bg-background border-l border-background-200 text-foreground size-12 flex items-center justify-center hover:bg-background-200",
              (!block || isLatestBlock) &&
                "cursor-not-allowed pointer-events-none text-foreground-300",
            )}
            to={{
              pathname: `../block/${block?.block_number + 1}`,
              hash,
            }}
          >
            <WedgeIcon variant="right" />
          </Link>
        </PageHeaderRight>
      </PageHeader>

      {error ? (
        <NotFound />
      ) : (
        <div className="flex flex-col gap-[40px] pb-8">
          <div className="flex flex-col sl:flex-row sl:h-[73vh] gap-[4px]">
            <div className="sl:min-w-[337px] flex flex-col gap-[4px] sl:overflow-y-scroll">
              <Card className="p-0 rounded-sm">
                <CardContent className="flex-row justify-between">
                  <div className="flex flex-col gap-2">
                    <CardLabel>Status</CardLabel>
                    {block ? (
                      <p
                        className="inline-block text-[13px] font-semibold
                            bg-gradient-to-r from-[#fff] to-[#636363]
                            bg-clip-text text-transparent
                             [text-shadow:0px_0px_10px_#6A6863]"
                      >
                        {getFinalityStatus(block.status)}
                      </p>
                    ) : (
                      <Skeleton className="h-4 w-28" />
                    )}
                  </div>

                  <div className="flex flex-col gap-[6px] w-44">
                    <CardLabel>Timestamp</CardLabel>
                    {block ? (
                      <div className="font-semibold">
                        {dayjs
                          .unix(block?.timestamp)
                          .format("MMM D YYYY HH:mm:ss")}
                      </div>
                    ) : (
                      <Skeleton className="h-6 w-full" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="flex-1 overflow-y-scroll scrollbar-none p-0 gap-0 rounded-sm rounded-bl-[12px]">
                <CardContent className="gap-[8px]">
                  <div className="flex items-center justify-between">
                    <CardLabel>Hash</CardLabel>
                    <CopyableInteger length={1} value={block?.block_hash} />
                  </div>
                  <div className="flex items-center justify-between">
                    <CardLabel>State root</CardLabel>
                    <CopyableInteger length={1} value={block?.new_root} />
                  </div>
                  <div className="flex items-center justify-between">
                    <CardLabel>Parent hash</CardLabel>
                    <CopyableInteger length={1} value={block?.parent_hash} />
                  </div>
                </CardContent>

                <Separator />

                <CardContent className="justify-between gap-[8px]">
                  <CardLabel>Sequencer</CardLabel>
                  <div
                    className="flex flex-row items-center justify-between bg-background-200 hover:bg-[#2B2F2C] rounded-sm py-[4px] px-[10px] border border-[#454B46] cursor-pointer"
                    onClick={onClickSequencerAddress}
                  >
                    <CopyableInteger
                      containerClassName="w-full justify-between"
                      length={3}
                      value={block?.sequencer_address}
                      onClick={() => {}}
                      onIconClick={(e) => {
                        e?.stopPropagation();
                        onCopyValue(block?.sequencer_address);
                      }}
                    />
                  </div>
                </CardContent>

                <Separator />

                <CardContent className="items-center flex-row justify-between">
                  <CardLabel>Starknet version</CardLabel>
                  <div className="font-mono text-foreground font-semibold">
                    {block ? (
                      block.starknet_version
                    ) : (
                      <Skeleton className="h-6 w-40" />
                    )}
                  </div>
                </CardContent>

                <Separator />

                <CardContent className="gap-[15px]">
                  <CardHeader className="px-0 gap-[12px] text-foreground-100">
                    <GasIcon />
                    <CardTitle className="p-0">gas prices</CardTitle>
                  </CardHeader>

                  <div className="space-y-[8px]">
                    <CardLabel>L1 execution gas</CardLabel>

                    <div className="flex items-center gap-px">
                      <button
                        type="button"
                        className="bg-background-200 hover:bg-background-300 p-[12px] flex-1 flex flex-col items-start w-full gap-1"
                        onClick={() =>
                          onCopyValue(block?.l1_gas_price.price_in_fri ?? "0")
                        }
                      >
                        <CardLabel className="uppercase">strk</CardLabel>
                        <div className="flex items-center justify-between w-full">
                          {block ? (
                            (() => {
                              const formatted = formatFri(
                                Number(
                                  cairo.felt(block.l1_gas_price.price_in_fri),
                                ),
                              );
                              return (
                                <>
                                  <div className="font-mono text-foreground font-semibold">
                                    {formatted.value}
                                  </div>
                                  <Badge className="uppercase bg-background-500 text-[10px]/[12px] font-medium px-[5px] py-[3px] pointer-events-none">
                                    {formatted.unit.toLowerCase()}
                                  </Badge>
                                </>
                              );
                            })()
                          ) : (
                            <>
                              <Skeleton className="h-4 w-40" />
                              <Badge className="uppercase bg-background-500 text-[10px]/[12px] font-medium px-[5px] py-[3px] pointer-events-none">
                                fri
                              </Badge>
                            </>
                          )}
                        </div>
                      </button>

                      <button
                        type="button"
                        className="bg-background-200 hover:bg-background-300 p-[12px] flex-1 flex flex-col items-start w-full gap-1"
                        onClick={() =>
                          onCopyValue(block?.l1_gas_price.price_in_wei ?? "0")
                        }
                      >
                        <CardLabel className="uppercase">eth</CardLabel>
                        <div className="flex items-center justify-between w-full">
                          {block ? (
                            (() => {
                              const formatted = formatWei(
                                Number(
                                  cairo.felt(block.l1_gas_price.price_in_wei),
                                ),
                              );
                              return (
                                <>
                                  <div className="font-mono text-foreground font-semibold">
                                    {formatted.value}
                                  </div>
                                  <Badge className="uppercase bg-background-500 text-[10px]/[12px] font-medium px-[5px] py-[3px] pointer-events-none">
                                    {formatted.unit.toLowerCase()}
                                  </Badge>
                                </>
                              );
                            })()
                          ) : (
                            <>
                              <Skeleton className="h-4 w-40" />
                              <Badge className="uppercase bg-background-500 text-[10px]/[12px] font-medium px-[5px] py-[3px] pointer-events-none">
                                wei
                              </Badge>
                            </>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-[8px]">
                    <CardLabel>L1 data gas</CardLabel>

                    <div className="flex items-center gap-px">
                      <button
                        type="button"
                        className="bg-background-200 hover:bg-background-300 p-[12px] flex-1 flex flex-col items-start w-full gap-1"
                        onClick={() =>
                          onCopyValue(
                            block?.l1_data_gas_price.price_in_fri ?? "0",
                          )
                        }
                      >
                        <CardLabel className="uppercase">strk</CardLabel>
                        <div className="flex items-center justify-between w-full">
                          {block ? (
                            (() => {
                              const formatted = formatFri(
                                Number(
                                  cairo.felt(
                                    block.l1_data_gas_price.price_in_fri,
                                  ),
                                ),
                              );
                              return (
                                <>
                                  <div className="font-mono text-foreground font-semibold">
                                    {formatted.value}
                                  </div>
                                  <Badge className="uppercase bg-background-500 text-[10px]/[12px] font-medium px-[5px] py-[3px] pointer-events-none">
                                    {formatted.unit.toLowerCase()}
                                  </Badge>
                                </>
                              );
                            })()
                          ) : (
                            <>
                              <Skeleton className="h-4 w-40" />
                              <Badge className="uppercase bg-background-500 text-[10px]/[12px] font-medium px-[5px] py-[3px] pointer-events-none">
                                fri
                              </Badge>
                            </>
                          )}
                        </div>
                      </button>

                      <button
                        type="button"
                        className="bg-background-200 hover:bg-background-300 p-[12px] flex-1 flex flex-col items-start w-full gap-1"
                        onClick={() =>
                          onCopyValue(
                            block?.l1_data_gas_price.price_in_wei ?? "0",
                          )
                        }
                      >
                        <CardLabel className="uppercase">eth</CardLabel>
                        <div className="flex items-center justify-between w-full">
                          {block ? (
                            (() => {
                              const formatted = formatWei(
                                Number(
                                  cairo.felt(
                                    block.l1_data_gas_price.price_in_wei,
                                  ),
                                ),
                              );
                              return (
                                <>
                                  <div className="font-mono text-foreground font-semibold">
                                    {formatted.value}
                                  </div>
                                  <Badge className="uppercase bg-background-500 text-[10px]/[12px] font-medium px-[5px] py-[3px] pointer-events-none">
                                    {formatted.unit.toLowerCase()}
                                  </Badge>
                                </>
                              );
                            })()
                          ) : (
                            <>
                              <Skeleton className="h-4 w-40" />
                              <Badge className="uppercase bg-background-500 text-[10px]/[12px] font-medium px-[5px] py-[3px] pointer-events-none">
                                wei
                              </Badge>
                            </>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card
              ref={tableContainerRef}
              className="flex-1 p-0 rounded-sm rounded-br-[12px] gap-0 h-[388px] md:h-auto"
            >
              <Tabs value={tab.selected} onValueChange={tab.onChange}>
                <CardContent className="pb-0 pt-[3px] gap-0">
                  <TabsList className="gap-[12px] p-0">
                    <TabsTrigger
                      className="data-[state=active]:shadow-none gap-[4px] p-[8px]"
                      value="transactions"
                    >
                      <ListIcon variant="solid" />
                      <p className="text-[13px]/[20px] font-normal">
                        Transactions
                      </p>
                    </TabsTrigger>
                    <TabsTrigger
                      className="data-[state=active]:shadow-none gap-[4px] p-[8px]"
                      value="events"
                    >
                      <PulseIcon variant="solid" />
                      <p className="text-[13px]/[20px] font-normal">Events</p>
                    </TabsTrigger>
                  </TabsList>
                </CardContent>

                <Separator />

                <CardContent className="h-full py-[15px] gap-0 md:min-h-[577px]">
                  <TabsContent
                    value="transactions"
                    className="flex flex-col gap-[15px] w-full flex-1 m-0 relative"
                  >
                    <MultiFilter
                      placeholder="Type"
                      value={
                        (txs.getColumn("type")?.getFilterValue() as string[]) ??
                        []
                      }
                      onValueChange={(values) => {
                        // If no values selected or "ALL" is conceptually selected, show all
                        if (values.length === 0) {
                          txs.getColumn("type")?.setFilterValue(undefined);
                        } else {
                          // Set filter to show rows that match any of the selected values
                          txs.getColumn("type")?.setFilterValue(values);
                        }
                      }}
                      items={[
                        { key: "INVOKE", value: "Invoke" },
                        { key: "DEPLOY_ACCOUNT", value: "Deploy Account" },
                        { key: "DECLARE", value: "Declare" },
                      ]}
                    />
                    {tableContainerHeight > 0 && (
                      <DataTable
                        table={txs}
                        onRowClick={(row) => navigate(`../tx/${row.hash}`)}
                        style={{
                          height: isMobile
                            ? "auto"
                            : tableContainerHeight - 100,
                        }}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="events" className="m-0 h-full">
                    {tableContainerHeight > 0 && (
                      <DataTable
                        table={events}
                        onRowClick={(row) =>
                          navigate(`../event/${row.txn_hash}-${row.id}`)
                        }
                        style={{
                          height: isMobile ? "auto" : tableContainerHeight - 63,
                        }}
                      />
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          <ExecutionResourcesCard
            blockComputeData={blockComputeData}
            executions={executions}
          />
        </div>
      )}
    </div>
  );
}

const Separator = memo(({ className }: { className?: string }) => (
  <span>
    <CardSeparator className={cn("m-0", className)} />
  </span>
));

// since all card content will inherit the same padding layout
const CardContent = memo(
  ({
    className,
    children,
  }: {
    className?: string;
    children?: React.ReactNode;
  }) => (
    <CardContentOld className={cn("px-[15px] py-[10px]", className)}>
      {children}
    </CardContentOld>
  ),
);
