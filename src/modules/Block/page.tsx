import { formatNumber } from "@/shared/utils/number";
import { formatSnakeCaseToDisplayValue } from "@/shared/utils/string";
import { cairo } from "starknet";
import {
  GasIcon,
  BoltIcon,
  StackDiamondIcon,
  cn,
  Skeleton,
  ListIcon,
  PulseIcon,
  WedgeIcon,
} from "@cartridge/ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardIcon,
  CardLabel,
  CardSeparator,
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
import { TxList } from "./TxList";
import { EventList } from "./EventList";
import { NotFound } from "../NotFound/page";
import { useHashLinkTabs } from "@/shared/hooks/useHashLinkTabs";
import { Loading } from "@/shared/components/Loading";
import { useBlock } from "./hooks";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/tabs";
import { Hash } from "@/shared/components/hash";
import { Link, useLocation } from "react-router-dom";
import { useBlockNumber } from "@/shared/hooks/useBlockNumber";
import dayjs from "dayjs";
import { getFinalityStatus } from "@/shared/utils/receipt";
import { Badge } from "@/shared/components/badge";

export function Block() {
  const { onTabChange } = useHashLinkTabs();
  const {
    data: { blockId, block, txs, events, executions, blockComputeData },
    isLoading,
    error,
  } = useBlock();
  const { blockNumber: latestBlockNumber } = useBlockNumber();
  const { hash } = useLocation();

  const isLatestBlock =
    latestBlockNumber !== undefined &&
    block?.block_number >= Number(latestBlockNumber);

  return (
    <div className="w-full flex flex-col gap-2">
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

      <PageHeader>
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
              "bg-background border-l border-background-200 text-foreground size-10 flex items-center justify-center cursor-pointer hover:bg-background-200",
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
              "bg-background border-l border-background-200 text-foreground size-10 flex items-center justify-center hover:bg-background-200",
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

      {isLoading || (!error && !block) ? (
        <Loading />
      ) : error || !block ? (
        <NotFound />
      ) : (
        <div className="flex flex-col gap-2 pb-8">
          <div className="flex flex-col sl:flex-row sl:h-[73vh] gap-2">
            <div className="sl:w-[468px] sl:min-w-[468px] flex flex-col gap-[6px] sl:overflow-y-scroll">
              <Card>
                <CardContent className="flex-row justify-between">
                  <div className="flex flex-col gap-2">
                    <CardLabel>Status</CardLabel>
                    {block ? (
                      <div className="font-bold text-foreground">
                        {getFinalityStatus(block.status)}
                      </div>
                    ) : (
                      <Skeleton className="h-4 w-28" />
                    )}
                  </div>

                  <div className="flex flex-col gap-2 w-44">
                    <CardLabel>Timestamp</CardLabel>
                    {block ? (
                      <div className="font-bold text-foreground">
                        {dayjs
                          .unix(block?.timestamp)
                          .format("MMM D YYYY HH:mm:ss")}
                      </div>
                    ) : (
                      <Skeleton className="h-4 w-full" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="flex-1">
                <CardContent>
                  <div className="flex items-center justify-between">
                    <CardLabel>Hash</CardLabel>
                    <Hash value={block.block_hash} />
                  </div>
                  <div className="flex items-center justify-between">
                    <CardLabel>State root</CardLabel>
                    <Hash value={block.new_root} />
                  </div>
                  <div className="flex items-center justify-between">
                    <CardLabel>Parent hash</CardLabel>
                    <Hash value={block.parent_hash} />
                  </div>
                </CardContent>

                <CardSeparator />

                <CardContent>
                  <div className="flex items-center justify-between">
                    <CardLabel>Sequencer</CardLabel>
                    <Hash
                      value={block.sequencer_address}
                      to={`../contract/${block.sequencer_address}`}
                    />
                  </div>
                </CardContent>

                <CardSeparator />

                <CardContent>
                  <div className="flex items-center justify-between">
                    <CardLabel>Starknet version</CardLabel>
                    <div className="font-mono text-foreground font-semibold">
                      {block.starknet_version}
                    </div>
                  </div>
                </CardContent>

                <CardSeparator />

                <CardHeader>
                  <CardIcon icon={<GasIcon />} />
                  <CardTitle>gas prices</CardTitle>
                </CardHeader>

                <CardContent className="gap-4">
                  <CardLabel>L1 execution gas</CardLabel>

                  <div className="flex items-center gap-px">
                    <div className="bg-background-200 p-3 flex-1 flex flex-col gap-1">
                      <CardLabel className="uppercase">strk</CardLabel>
                      <div className="flex items-center justify-between">
                        {block.l1_gas_price ? (
                          <div className="font-mono text-foreground font-semibold">
                            {formatNumber(
                              Number(
                                cairo.felt(block.l1_gas_price.price_in_fri),
                              ),
                            )}
                          </div>
                        ) : (
                          <Skeleton className="h-4 w-full" />
                        )}
                        <Badge className="uppercase bg-background-500">
                          gfri
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-background-200 p-3 flex-1 flex flex-col gap-1">
                      <CardLabel className="uppercase">eth</CardLabel>
                      <div className="flex items-center justify-between">
                        {block.l1_gas_price ? (
                          <div className="font-mono text-foreground font-semibold">
                            {formatNumber(
                              Number(
                                cairo.felt(block.l1_gas_price.price_in_wei),
                              ),
                            )}
                          </div>
                        ) : (
                          <Skeleton className="h-4 w-full" />
                        )}
                        <Badge className="uppercase bg-background-500">
                          gwei
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <CardLabel>L1 data gas</CardLabel>

                  <div className="flex items-center gap-px">
                    <div className="bg-background-200 p-3 flex-1 flex flex-col gap-1">
                      <CardLabel className="uppercase">strk</CardLabel>
                      <div className="flex items-center justify-between">
                        {block.l1_data_gas_price ? (
                          <div className="font-mono text-foreground font-semibold">
                            {formatNumber(
                              Number(
                                cairo.felt(
                                  block.l1_data_gas_price.price_in_fri,
                                ),
                              ),
                            )}
                          </div>
                        ) : (
                          <Skeleton className="h-4 w-full" />
                        )}
                        <Badge className="uppercase bg-background-500">
                          gfri
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-background-200 p-3 flex-1 flex flex-col gap-1">
                      <CardLabel className="uppercase">eth</CardLabel>
                      <div className="flex items-center justify-between">
                        {block.l1_data_gas_price ? (
                          <div className="font-mono text-foreground font-semibold">
                            {formatNumber(
                              Number(
                                cairo.felt(
                                  block.l1_data_gas_price.price_in_wei,
                                ),
                              ),
                            )}
                          </div>
                        ) : (
                          <Skeleton className="h-4 w-full" />
                        )}
                        <Badge className="uppercase bg-background-500">
                          gwei
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="h-full flex-grow grid grid-rows-[min-content_1fr]">
              <Tabs defaultValue="transactions" onValueChange={onTabChange}>
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
                <CardSeparator />
                <CardContent>
                  <TabsContent value="transactions">
                    <TxList transactions={txs} />
                  </TabsContent>
                  <TabsContent value="events">
                    <EventList events={events} />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          <Card className="gap-0 pb-0">
            <CardHeader className="pb-3 border-b border-background-200">
              <CardIcon icon={<BoltIcon variant="solid" />} />
              <CardTitle>Execution resources</CardTitle>
            </CardHeader>

            <div className="flex flex-col md:flex-row divide-x divide-y divide-background-200 relative">
              <CardContent className="py-2 min-w-96">
                <div>
                  <CardLabel>steps</CardLabel>
                  <div className="font-mono text-foreground font-semibold overflow-auto">
                    {formatNumber(blockComputeData.steps)}
                  </div>
                </div>
              </CardContent>

              <CardContent className="py-2 -top-px -left-px min-w-96">
                <CardLabel>gas</CardLabel>
                <div className="flex flex-wrap gap-px">
                  <div className="bg-background-200 flex flex-col p-2 min-w-40">
                    <CardLabel>l1</CardLabel>
                    <div className="font-mono text-foreground font-semibold">
                      {formatNumber(blockComputeData.gas)}
                    </div>
                  </div>
                  <div className="bg-background-200 flex flex-col p-2 min-w-40">
                    <CardLabel>l1 data</CardLabel>
                    <div className="font-mono text-foreground font-semibold">
                      {formatNumber(blockComputeData.data_gas)}
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardContent className="py-2 flex flex-col gap-2 -top-px -left-px">
                <CardLabel>builtins counter</CardLabel>
                <div className="flex flex-wrap gap-px">
                  {Object.entries(executions).map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-background-200 flex flex-col p-2 w-40"
                    >
                      <CardLabel>
                        {formatSnakeCaseToDisplayValue(key)}
                      </CardLabel>
                      <div className="font-mono text-foreground font-semibold overflow-auto text-ellipsis">
                        {formatNumber(value)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
