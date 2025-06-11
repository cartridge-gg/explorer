import { formatNumber } from "@/shared/utils/number";
import { truncateString } from "@/shared/utils/string";
import { useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import { cairo } from "starknet";
import CalldataDisplay from "./components/CalldataDisplay";
import {
  BoltIcon,
  CoinsIcon,
  GasIcon,
  StackOvalIcon,
  ListIcon,
  Skeleton,
  PulseIcon,
  PencilIcon,
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
import { Badge } from "@/shared/components/badge";
import { DataTable } from "@/shared/components/data-table";
import {
  PageHeader,
  PageHeaderRight,
  PageHeaderTitle,
} from "@/shared/components/PageHeader";
import SignatureDisplay from "./components/SignatureDisplay";
import { NotFound } from "../NotFound/page";
import { useTransaction } from "./hooks";
import { useHashLinkTabs } from "@/shared/hooks/useHashLinkTabs";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/tabs";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/shared/components/breadcrumb";
import { Hash } from "@/shared/components/hash";
import dayjs from "dayjs";
import { getFinalityStatus } from "@/shared/utils/receipt";

export function Transaction() {
  const tab = useHashLinkTabs("calldata");
  const { txHash } = useParams<{ txHash: string }>();
  const {
    error,
    data: {
      tx,
      receipt,
      calldata,
      block,
      blockComputeData,
      executions,
      events,
      storageDiff,
    },
  } = useTransaction({ txHash });
  const { isMobile } = useScreen();

  return (
    <div className="w-full flex flex-col gap-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="..">Explorer</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="../txns">Transactions</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {txHash ? (
              <BreadcrumbPage>
                {isMobile && txHash ? truncateString(txHash) : txHash}
              </BreadcrumbPage>
            ) : (
              <Skeleton className="h-4 w-[400px] rounded-sm" />
            )}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader>
        <PageHeaderTitle>
          <ListIcon variant="solid" />
          <div>Transaction</div>
        </PageHeaderTitle>

        <PageHeaderRight className="px-2 gap-2">
          {tx ? (
            <>
              <Badge>{tx?.type.toLowerCase()}</Badge>
              <Badge>v{Number(tx.version)}</Badge>
            </>
          ) : (
            <>
              <Skeleton className="rounded-sm h-6 w-14" />
              <Skeleton className="rounded-sm h-6 w-8" />
            </>
          )}
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
                        {getFinalityStatus(receipt.finality_status)}
                      </div>
                    ) : (
                      <Skeleton className="h-4 w-28" />
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
                      <Skeleton className="h-4 w-full" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="flex-1">
                <CardContent>
                  <div className="flex justify-between gap-2">
                    <CardLabel>Hash</CardLabel>
                    <div>
                      <Hash value={receipt?.transaction_hash} />
                    </div>
                  </div>
                  <div className="flex justify-between gap-2">
                    <CardLabel>Block</CardLabel>
                    <div className="flex items-center">
                      <Badge className="p-2"># {receipt?.block_number}</Badge>
                      <Hash
                        value={receipt?.block_hash}
                        to={`../block/${receipt?.block_hash}`}
                      />
                    </div>
                  </div>
                </CardContent>

                {(!!tx?.sender_address || !!tx?.nonce) && (
                  <>
                    <CardSeparator />
                    <CardContent>
                      {!!tx?.sender_address && (
                        <div className="flex justify-between gap-2">
                          <CardLabel>Sender</CardLabel>
                          <Hash
                            value={tx?.sender_address}
                            to={`../contract/${tx?.sender_address}`}
                          />
                        </div>
                      )}
                      {!!tx?.nonce && (
                        <div className="flex justify-between gap-2">
                          <CardLabel>Nonce</CardLabel>
                          <div>{Number(tx?.nonce)}</div>
                        </div>
                      )}
                    </CardContent>
                  </>
                )}

                <CardSeparator />

                <CardHeader>
                  <CardIcon icon={<GasIcon />} />
                  <CardTitle>Resource Bounds</CardTitle>
                </CardHeader>

                <CardContent className="gap-4">
                  <CardLabel>L1 execution gas</CardLabel>

                  <div className="flex items-center gap-px">
                    <div className="bg-background-200 p-3 w-60 flex flex-col gap-1">
                      <CardLabel className="uppercase">Max amount</CardLabel>
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-foreground font-semibold">
                          {formatNumber(
                            Number(
                              cairo.felt(
                                tx?.resource_bounds?.l1_gas?.max_amount ?? 0,
                              ),
                            ),
                          )}
                        </div>
                        <Badge className="uppercase bg-background-500">
                          wei
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-background-200 p-3 w-60 flex flex-col gap-1">
                      <CardLabel className="uppercase">
                        Max price / unit
                      </CardLabel>
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-foreground font-semibold">
                          {formatNumber(
                            Number(
                              cairo.felt(
                                tx?.resource_bounds?.l1_gas
                                  ?.max_price_per_unit ?? 0,
                              ),
                            ),
                          )}
                        </div>
                        <Badge className="uppercase bg-background-500">
                          fri
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <CardLabel>L1 data gas</CardLabel>

                  <div className="flex items-center gap-px">
                    <div className="bg-background-200 p-3 w-60 flex flex-col gap-1">
                      <CardLabel className="uppercase">Max amount</CardLabel>
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-foreground font-semibold">
                          {formatNumber(
                            Number(
                              cairo.felt(
                                tx?.resource_bounds?.l1_data_gas?.max_amount ??
                                  0,
                              ),
                            ),
                          )}
                        </div>
                        <Badge className="uppercase bg-background-500">
                          wei
                        </Badge>
                      </div>
                    </div>

                    <div className="bg-background-200 p-3 w-60 flex flex-col gap-1">
                      <CardLabel className="uppercase">
                        Max price / unit
                      </CardLabel>
                      <div className="flex items-center justify-between">
                        <div className="font-mono text-foreground font-semibold">
                          {formatNumber(
                            Number(
                              cairo.felt(
                                tx?.resource_bounds?.l1_data_gas
                                  ?.max_price_per_unit ?? 0,
                              ),
                            ),
                          )}
                        </div>
                        <Badge className="uppercase bg-background-500">
                          fri
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>

                {!!(
                  tx?.fee_data_availability_mode ??
                  tx?.nonce_data_availability_mode
                ) && (
                  <>
                    <CardSeparator />

                    <CardHeader>
                      <CardIcon icon={<BoltIcon variant="solid" />} />
                      <CardTitle>Data Availability Mode</CardTitle>
                    </CardHeader>

                    <CardContent>
                      <div className="flex justify-between">
                        <CardLabel>Fee</CardLabel>
                        <div>{tx.fee_data_availability_mode}</div>
                      </div>

                      <div className="flex justify-between">
                        <CardLabel>Nonce</CardLabel>
                        <div>{tx.nonce_data_availability_mode}</div>
                      </div>
                    </CardContent>
                  </>
                )}

                {!!tx?.tip && (
                  <>
                    <CardSeparator />

                    <CardHeader>
                      <CardIcon icon={<CoinsIcon variant="solid" />} />
                      <CardTitle>Tip</CardTitle>
                    </CardHeader>

                    <CardContent>
                      <div className="flex justify-between">
                        <CardLabel>Tip</CardLabel>
                        <div>{tx.tip}</div>
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            </div>

            <Card className="h-full flex-grow grid grid-rows-[min-content_1fr]">
              <Tabs
                value={tab.selected}
                onValueChange={tab.onChange}
                className="h-full"
              >
                <CardContent>
                  <TabsList>
                    <TabsTrigger value="calldata">
                      <ListIcon variant="solid" />
                      <div>Calldata</div>
                    </TabsTrigger>
                    <TabsTrigger value="signature">
                      <PencilIcon variant="solid" />
                      <div>Signature</div>
                    </TabsTrigger>
                    <TabsTrigger value="events">
                      <PulseIcon variant="solid" />
                      <div>Events</div>
                    </TabsTrigger>
                    <TabsTrigger value="storage-diffs">
                      <StackOvalIcon variant="solid" />
                      <div>Storage Diffs</div>
                    </TabsTrigger>
                  </TabsList>
                </CardContent>
                <CardSeparator />

                <CardContent>
                  <TabsContent value="calldata">
                    <CalldataDisplay calldata={calldata} />
                  </TabsContent>
                  <TabsContent value="signature">
                    {!!tx?.signature && (
                      <SignatureDisplay signature={tx.signature} />
                    )}
                  </TabsContent>
                  <TabsContent value="events">
                    <DataTable table={events} />
                  </TabsContent>
                  <TabsContent value="storage-diffs">
                    <DataTable table={storageDiff} />
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
