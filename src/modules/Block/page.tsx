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
  CardContent,
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
import { Hash } from "@/shared/components/hash";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useBlockNumber } from "@/shared/hooks/useBlockNumber";
import dayjs from "dayjs";
import { getFinalityStatus } from "@/shared/utils/receipt";
import { Badge } from "@/shared/components/badge";
import { DataTable } from "@/shared/components/data-table";
import { MultiFilterTransaction } from "@/shared/components/filter";
import { memo, useCallback } from "react";

export function Block() {
  const tab = useHashLinkTabs("transactions");
  const {
    data: { blockId, block, txs, events, executions, blockComputeData },
    error,
  } = useBlock();
  const { blockNumber: latestBlockNumber } = useBlockNumber();
  const { hash } = useLocation();
  const navigate = useNavigate();

  const isLatestBlock =
    latestBlockNumber !== undefined &&
    block?.block_number >= Number(latestBlockNumber);

  const onCopySequencerAddress = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!block?.sequencer_address) {
        return;
      }

      navigator.clipboard.writeText(block?.sequencer_address);
      toast.success("Address copied to clipboard");
    },
    [block?.sequencer_address],
  );

  const onCopyValue = useCallback((value: string) => {
    navigator.clipboard.writeText(value);
    toast.success("Value copied to clipboard");
  }, []);

  return (
    <div className="w-full flex flex-col gap-[3px] sl:w-[1135px]">
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
            <BreadcrumbPage>{blockId}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        containerClassName="rounded-t-[12px] rounded-b-[4px]"
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
          <div className="flex flex-col sl:flex-row sl:h-[73vh] gap-[3px]">
            <div className="sl:min-w-[337px] flex flex-col gap-[6px] sl:overflow-y-scroll">
              <Card>
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

              <Card className="flex-1 overflow-y-scroll scrollbar-none py-[10px] px-[15px] gap-0">
                <CardContent className="px-0 gap-[8px]">
                  <div className="flex items-center justify-between">
                    <CardLabel>Hash</CardLabel>
                    <Hash value={block?.block_hash} />
                  </div>
                  <div className="flex items-center justify-between">
                    <CardLabel>State root</CardLabel>
                    <Hash value={block?.new_root} />
                  </div>
                  <div className="flex items-center justify-between">
                    <CardLabel>Parent hash</CardLabel>
                    <Hash value={block?.parent_hash} />
                  </div>
                </CardContent>

                <Separator />

                <CardContent className="px-0">
                  <div className="flex flex-col justify-between gap-[8px]">
                    <CardLabel>Sequencer</CardLabel>
                    <div
                      className="bg-background-200 hover:bg-[#2B2F2C] rounded-sm py-[4px] px-[10px] border border-[#454B46] cursor-pointer"
                      onClick={onCopySequencerAddress}
                    >
                      <Hash value={block?.sequencer_address} />
                    </div>
                  </div>
                </CardContent>

                <Separator />

                <CardContent className="px-0">
                  <div className="flex items-center justify-between">
                    <CardLabel>Starknet version</CardLabel>
                    <div className="font-mono text-foreground font-semibold">
                      {block ? (
                        block.starknet_version
                      ) : (
                        <Skeleton className="h-6 w-40" />
                      )}
                    </div>
                  </div>
                </CardContent>

                <Separator />

                <CardHeader className="px-0 mb-[15px]">
                  <GasIcon />
                  <CardTitle>gas prices</CardTitle>
                </CardHeader>

                <CardContent className="gap-[15px] px-0">
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

            <Card className="flex-1">
              <Tabs value={tab.selected} onValueChange={tab.onChange}>
                <CardContent>
                  <TabsList>
                    <TabsTrigger value="transactions">
                      <ListIcon variant="solid" />
                      <div>Transactions</div>
                    </TabsTrigger>
                    <TabsTrigger value="events">
                      <PulseIcon variant="solid" />
                      <div>Events</div>
                    </TabsTrigger>
                  </TabsList>
                </CardContent>

                <Separator />

                <CardContent className="h-full">
                  <TabsContent
                    value="transactions"
                    className="flex flex-col gap-2 w-full flex-1"
                  >
                    <MultiFilterTransaction
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
                    <DataTable
                      table={txs}
                      onRowClick={(row) => navigate(`../tx/${row.hash}`)}
                    />
                  </TabsContent>

                  <TabsContent value="events" className="h-full">
                    <DataTable
                      table={events}
                      onRowClick={(row) =>
                        navigate(`../event/${row.txn_hash}-${row.id}`)
                      }
                    />
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

const Separator = memo(() => (
  <CardSeparator className="my-[10px] relative left-[-15px] w-[calc(100%+30px)]" />
));
