import { formatNumber } from "@/shared/utils/number";
import { truncateString } from "@/shared/utils/string";
import { useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import { BigNumberish, cairo } from "starknet";
import { Calldata } from "./calldata";
import {
  BoltIcon,
  CoinsIcon,
  GasIcon,
  StackOvalIcon,
  ListIcon,
  Skeleton,
  PulseIcon,
  PencilIcon,
  Tabs as UITabs,
  TabsList as UITabsList,
  TabsTrigger as UITabsTrigger,
  TabsContent as UITabsContent,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from "@cartridge/ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
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
import FeltList from "@/shared/components/FeltList";
import { Editor } from "@/shared/components/editor";

/**
 *
 * @param input - raw value
 * @returns converted value in 18 decimal places
 */
function ConvertToSTRK(input: number | bigint) {
  return Number(input) / 1e18;
}

// Helper component for truncating long values with tooltip
function TruncatedValue({
  value,
  maxLength = 20,
  className = "",
}: {
  value: string | number;
  maxLength?: number;
  className?: string;
}) {
  const stringValue = String(value);
  const shouldTruncate = stringValue.length > maxLength;

  if (!shouldTruncate) {
    return <div className={className}>{stringValue}</div>;
  }

  const truncated = stringValue.substring(0, maxLength) + "...";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          className={cn(
            "text-[13px]/[16px] tracking-[0.26px] font-semibold",
            className,
          )}
        >
          {truncated}
        </TooltipTrigger>
        <TooltipContent className="bg-background-200 text-foreground-200 max-w-xs break-all">
          {stringValue}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function Transaction() {
  const { txHash } = useParams<{ txHash: string }>();
  const {
    error,
    data: {
      tx,
      receipt,
      declared,
      block,
      blockComputeData,
      executions,
      events,
      storageDiff,
    },
  } = useTransaction({ txHash });
  const tab = useHashLinkTabs(
    tx?.type === "INVOKE"
      ? "calldata"
      : tx?.type === "DECLARE"
        ? "class"
        : "signature",
  );
  const { isMobile } = useScreen();

  return (
    <div className="w-full flex flex-col gap-2">
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
            <div className="sl:min-w-[337px] flex flex-col gap-[6px] sl:overflow-y-scroll">
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

              <Card className="flex-1 overflow-y-scroll scrollbar-none py-[10px] px-[15px]">
                <CardContent className="px-0">
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
                    <CardContent className="px-0">
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
                          <TruncatedValue
                            value={Number(tx?.nonce)}
                            maxLength={15}
                            className="font-mono"
                          />
                        </div>
                      )}
                    </CardContent>
                  </>
                )}

                <CardSeparator />

                <CardHeader className="px-0 mb-[15px]">
                  <GasIcon />
                  <CardTitle>Resource Bounds</CardTitle>
                </CardHeader>

                <CardContent className="gap-[15px] px-0">
                  <div className="space-y-[8px]">
                    <CardLabel>L1 execution gas</CardLabel>

                    <div className="flex items-center gap-px">
                      <div className="bg-background-200 p-[12px] flex-1 flex-col gap-1">
                        <CardLabel>Max amount</CardLabel>
                        <div className="flex items-center justify-between">
                          <TruncatedValue
                            value={formatNumber(
                              ConvertToSTRK(
                                Number(
                                  cairo.felt(
                                    tx?.resource_bounds?.l1_gas?.max_amount ??
                                      0,
                                  ),
                                ),
                              ),
                            )}
                            maxLength={12}
                            className="font-mono text-foreground font-semibold"
                          />
                          <Badge className="uppercase bg-background-500 text-[10px] font-medium">
                            strk
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-background-200 p-[12px] flex-1 flex-col gap-1">
                        <CardLabel>Max price / unit</CardLabel>
                        <div className="flex items-center justify-between">
                          <TruncatedValue
                            value={formatNumber(
                              ConvertToSTRK(
                                Number(
                                  cairo.felt(
                                    tx?.resource_bounds?.l1_gas
                                      ?.max_price_per_unit ?? 0,
                                  ),
                                ),
                              ),
                            )}
                            maxLength={12}
                            className="font-mono text-foreground font-semibold"
                          />
                          <Badge className="uppercase bg-background-500 text-[10px] font-medium">
                            strk
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-[8px]">
                    <CardLabel>L2 execution gas</CardLabel>

                    <div className="flex items-center gap-px">
                      <div className="bg-background-200 p-[12px] flex-1 flex-col gap-1">
                        <CardLabel>Max amount</CardLabel>
                        <div className="flex items-center justify-between">
                          <TruncatedValue
                            value={formatNumber(
                              ConvertToSTRK(
                                Number(
                                  cairo.felt(
                                    tx?.resource_bounds?.l2_gas?.max_amount ??
                                      0,
                                  ),
                                ),
                              ),
                            )}
                            maxLength={12}
                            className="font-mono text-foreground font-semibold"
                          />
                          <Badge className="uppercase bg-background-500 text-[10px] font-medium">
                            strk
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-background-200 p-[12px] flex-1 flex-col gap-1">
                        <CardLabel>Max price / unit</CardLabel>
                        <div className="flex items-center justify-between">
                          <TruncatedValue
                            value={formatNumber(
                              ConvertToSTRK(
                                Number(
                                  cairo.felt(
                                    tx?.resource_bounds?.l2_gas
                                      ?.max_price_per_unit ?? 0,
                                  ),
                                ),
                              ),
                            )}
                            maxLength={12}
                            className="font-mono text-foreground font-semibold"
                          />
                          <Badge className="uppercase bg-background-500 text-[10px] font-medium">
                            strk
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-[8px]">
                    <CardLabel>L1 data gas</CardLabel>

                    <div className="flex items-center gap-px">
                      <div className="bg-background-200 p-[12px] flex-1 flex-col gap-1">
                        <CardLabel>Max amount</CardLabel>
                        <div className="flex items-center justify-between">
                          <TruncatedValue
                            value={formatNumber(
                              ConvertToSTRK(
                                Number(
                                  cairo.felt(
                                    tx?.resource_bounds?.l1_data_gas
                                      ?.max_amount ?? 0,
                                  ),
                                ),
                              ),
                            )}
                            maxLength={12}
                            className="font-mono text-foreground font-semibold"
                          />
                          <Badge className="uppercase bg-background-500 text-[10px] font-medium">
                            strk
                          </Badge>
                        </div>
                      </div>

                      <div className="bg-background-200 p-[12px] flex-1 flex-col gap-1">
                        <CardLabel>Max price / unit</CardLabel>
                        <div className="flex items-center justify-between">
                          <TruncatedValue
                            value={formatNumber(
                              ConvertToSTRK(
                                Number(
                                  cairo.felt(
                                    tx?.resource_bounds?.l1_data_gas
                                      ?.max_price_per_unit ?? 0,
                                  ),
                                ),
                              ),
                            )}
                            maxLength={12}
                            className="font-mono text-foreground font-semibold"
                          />
                          <Badge className="uppercase bg-background-500 text-[10px] font-medium">
                            strk
                          </Badge>
                        </div>
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

                    <div className="space-y-[13px]">
                      <CardHeader className="px-0">
                        <BoltIcon variant="solid" />
                        <CardTitle>Data Availability Mode</CardTitle>
                      </CardHeader>

                      <CardContent className="px-0">
                        <div className="flex justify-between gap-2">
                          <CardLabel>Fee</CardLabel>
                          <TruncatedValue
                            value={tx.fee_data_availability_mode}
                            maxLength={15}
                          />
                        </div>

                        <div className="flex justify-between gap-2">
                          <CardLabel>Nonce</CardLabel>
                          <TruncatedValue
                            value={tx.nonce_data_availability_mode}
                            maxLength={15}
                          />
                        </div>
                      </CardContent>
                    </div>
                  </>
                )}

                {!!tx?.tip && (
                  <>
                    <CardSeparator />

                    <CardHeader className="px-0">
                      <CoinsIcon variant="solid" />
                      <CardTitle>Tip</CardTitle>
                    </CardHeader>

                    <CardContent className="px-0">
                      <div className="flex justify-between gap-2">
                        <CardLabel>Tip</CardLabel>
                        <TruncatedValue
                          value={tx.tip}
                          maxLength={15}
                          className="font-mono"
                        />
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            </div>

            <Card className="h-full flex-grow grid grid-rows-[min-content_1fr]">
              {tx ? (
                <Tabs
                  value={tab.selected}
                  onValueChange={tab.onChange}
                  className="h-full"
                >
                  <CardContent>
                    <TabsList>
                      {tx?.type === "INVOKE" && (
                        <TabsTrigger value="calldata">
                          <ListIcon variant="solid" />
                          <div>Calldata</div>
                        </TabsTrigger>
                      )}
                      {tx?.type === "DECLARE" && (
                        <TabsTrigger value="class">
                          <ListIcon variant="solid" />
                          <div>Class</div>
                        </TabsTrigger>
                      )}
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
                    {tx?.type === "INVOKE" && (
                      <TabsContent value="calldata">
                        <Calldata tx={tx} />
                      </TabsContent>
                    )}
                    {tx?.type === "DECLARE" && !!declared && (
                      <TabsContent
                        value="class"
                        className="flex flex-col gap-4"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <CardLabel>Class Hash</CardLabel>
                            <Hash
                              value={tx.class_hash}
                              to={`../class/${tx.class_hash}`}
                            />
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <CardLabel>Compiled Class Hash</CardLabel>
                            <Hash value={tx.compiled_class_hash} />
                          </div>
                        </div>

                        <Editor
                          className="min-h-[80vh]"
                          defaultLanguage="json"
                          value={JSON.stringify(declared, null, 2)}
                          options={{
                            readOnly: true,
                            scrollbar: {
                              alwaysConsumeMouseWheel: false,
                            },
                          }}
                        />
                      </TabsContent>
                    )}
                    <TabsContent value="signature">
                      <UITabs defaultValue="hex">
                        <UITabsList>
                          <UITabsTrigger value="hex">Hex</UITabsTrigger>
                          <UITabsTrigger value="decoded">Dec</UITabsTrigger>
                        </UITabsList>
                        <UITabsContent value="hex">
                          <Editor
                            className="min-h-[80vh]"
                            defaultLanguage="json"
                            value={JSON.stringify(tx?.signature ?? [], null, 2)}
                            options={{
                              readOnly: true,
                              scrollbar: {
                                alwaysConsumeMouseWheel: false,
                              },
                            }}
                          />
                        </UITabsContent>
                        <UITabsContent value="dec">
                          {tx ? (
                            <FeltList list={tx?.signature} displayAs="dec" />
                          ) : (
                            <Skeleton className="h-4 w-full" />
                          )}
                        </UITabsContent>
                      </UITabs>
                    </TabsContent>
                    <TabsContent value="events">
                      <DataTable table={events} />
                    </TabsContent>
                    <TabsContent value="storage-diffs">
                      <DataTable table={storageDiff} />
                    </TabsContent>
                  </CardContent>
                </Tabs>
              ) : (
                <Tabs>
                  <TabsList className="border-b border-background-200 animate-pulse pointer-events-none">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <TabsTrigger value={`dummy-tab-${i}`}>
                        <Skeleton className="h-4 w-40" />
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}
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
