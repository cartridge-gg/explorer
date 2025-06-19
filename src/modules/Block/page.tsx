import { formatNumber } from "@/shared/utils/number";
import { cairo } from "starknet";
import {
  GasIcon,
  StackDiamondIcon,
  cn,
  Skeleton,
  ListIcon,
  PulseIcon,
  WedgeIcon,
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@cartridge/ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardIcon,
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
import {
  FilterTransaction,
  MultiFilterTransaction,
} from "@/shared/components/filter";

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
        <div className="flex flex-col gap-2 pb-8">
          <div className="flex flex-col sl:flex-row sl:h-[73vh] gap-2">
            <div className="sl:w-[468px] sl:min-w-[468px] flex flex-col gap-[6px] sl:overflow-y-scroll">
              <Card>
                <CardContent className="flex-row justify-between">
                  <div className="flex flex-col gap-2">
                    <CardLabel>Status</CardLabel>
                    {block ? (
                      <div className="font-semibold">
                        {getFinalityStatus(block.status)}
                      </div>
                    ) : (
                      <Skeleton className="h-6 w-28" />
                    )}
                  </div>

                  <div className="flex flex-col gap-2 w-44">
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

              <Card className="flex-1">
                <CardContent>
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

                <CardSeparator />

                <CardContent>
                  <div className="flex items-center justify-between">
                    <CardLabel>Sequencer</CardLabel>
                    <Hash
                      value={block?.sequencer_address}
                      to={`../contract/${block?.sequencer_address}`}
                    />
                  </div>
                </CardContent>

                <CardSeparator />

                <CardContent>
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

                <CardSeparator />

                <CardHeader>
                  <CardIcon icon={<GasIcon />} />
                  <CardTitle>gas prices</CardTitle>
                </CardHeader>

                <CardContent className="gap-4">
                  <CardLabel>L1 execution gas</CardLabel>

                  <div className="flex items-center gap-px">
                    <div className="bg-background-200 p-3 w-60 flex flex-col gap-1">
                      <CardLabel className="uppercase">strk</CardLabel>
                      <div className="flex items-center justify-between">
                        {block ? (
                          <div className="font-mono text-foreground font-semibold">
                            {formatNumber(
                              Number(
                                cairo.felt(block.l1_gas_price.price_in_fri),
                              ),
                            )}
                          </div>
                        ) : (
                          <Skeleton className="h-4 w-40" />
                        )}
                        <Badge className="uppercase bg-background-500">
                          gfri
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-background-200 p-3 w-60 flex flex-col gap-1">
                      <CardLabel className="uppercase">eth</CardLabel>
                      <div className="flex items-center justify-between">
                        {block ? (
                          <div className="font-mono text-foreground font-semibold">
                            {formatNumber(
                              Number(
                                cairo.felt(block.l1_gas_price.price_in_wei),
                              ),
                            )}
                          </div>
                        ) : (
                          <Skeleton className="h-4 w-40" />
                        )}
                        <Badge className="uppercase bg-background-500">
                          gwei
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <CardLabel>L1 data gas</CardLabel>

                  <div className="flex items-center gap-px">
                    <div className="bg-background-200 p-3 w-60 flex flex-col gap-1">
                      <CardLabel className="uppercase">strk</CardLabel>
                      <div className="flex items-center justify-between">
                        {block ? (
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
                          <Skeleton className="h-4 w-40" />
                        )}
                        <Badge className="uppercase bg-background-500">
                          gfri
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-background-200 p-3 w-60 flex flex-col gap-1">
                      <CardLabel className="uppercase">eth</CardLabel>
                      <div className="flex items-center justify-between">
                        {block ? (
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
                          <Skeleton className="h-4 w-40" />
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

                <CardSeparator />

                <CardContent className="h-full">
                  <TabsContent
                    value="transactions"
                    className="flex flex-col gap-2 w-full flex-1"
                  >
                    <MultiFilterTransaction
                      value={txs.getColumn("type")?.getFilterValue() ?? []}
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
