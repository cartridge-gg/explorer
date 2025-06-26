import { truncateString } from "@/shared/utils/string";
import { useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import { cairo } from "starknet";
import { memo, useCallback } from "react";
import { toast } from "sonner";
import { Calldata } from "./calldata";
import {
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
  const value = Number(input) / 1e18;
  if (value === 0) return "-";

  // Convert to string without exponential notation
  const valueStr = value.toFixed(18);

  // For small numbers, keep only 1 significant digit
  if (value < 1 && value > 0) {
    // Match pattern: 0.000...1234567 and keep only first 1 digit after leading zeros
    const match = valueStr.match(/^(0\.0*)(\d{1})/);
    if (match) {
      return match[1] + match[2];
    }
  }

  return valueStr;
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

  const onCopySenderAddress = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!tx?.sender_address) {
        return;
      }

      navigator.clipboard.writeText(tx.sender_address);
      toast.success("Address copied to clipboard");
    },
    [tx?.sender_address],
  );

  const onCopyValue = useCallback((value: string) => {
    navigator.clipboard.writeText(value);
    toast.success("Value copied to clipboard");
  }, []);

  return (
    <div className="w-full flex flex-col gap-[3px] sl:w-[1134px]">
      <Breadcrumb className="mb-[7px]">
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

      <PageHeader
        containerClassName="rounded-t-[12px] rounded-b-[4px]"
        className="px-[15px] py-[8px]"
      >
        <PageHeaderTitle className="gap-[12px]">
          <ListIcon variant="solid" />
          <h1 className="text-[14px]/[20px] font-medium">Transaction</h1>
        </PageHeaderTitle>

        <PageHeaderRight className="pr-[15px] gap-[6px]">
          {tx ? (
            <>
              <Badge className="px-[7px] py-[2px]">
                <span className="text-[12px]/[16px] tracking-[0.24px] font-semibold">
                  {tx?.type.toLowerCase()}
                </span>
              </Badge>
              <Badge className="px-[7px] py-[2px]">
                <span className="text-[12px]/[16px] tracking-[0.24px] font-semibold">
                  v{Number(tx.version)}
                </span>
              </Badge>
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
        <div className="flex flex-col gap-[20px] lg:gap-[40px] pb-8">
          <div className="flex flex-col sl:flex-row sl:h-[73vh] gap-[3px]">
            <div className="sl:min-w-[337px] flex flex-col gap-[3px] sl:overflow-y-scroll">
              <Card className="py-[10px] px-[15px]">
                <CardContent className="flex-row justify-between px-0">
                  <div className="flex flex-col gap-[6px]">
                    <CardLabel>Status</CardLabel>
                    {block ? (
                      <p
                        className="inline-block text-[13px] font-semibold
                            bg-gradient-to-r from-[#fff] to-[#636363]
                            bg-clip-text text-transparent
                             [text-shadow:0px_0px_10px_#6A6863]"
                      >
                        {getFinalityStatus(receipt.finality_status)}
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
                      <Skeleton className="h-4 w-full" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="flex-1 overflow-y-scroll scrollbar-none py-[10px] px-[15px] gap-0">
                <CardContent className="px-0 gap-[8px]">
                  <div className="flex justify-between gap-2">
                    <CardLabel>Hash</CardLabel>
                    <div>
                      <Hash value={receipt?.transaction_hash} />
                    </div>
                  </div>
                  <div className="flex justify-between gap-2">
                    <CardLabel>Block</CardLabel>
                    <div className="flex items-center">
                      <p>{receipt?.block_number}</p>
                    </div>
                  </div>
                </CardContent>
                {(!!tx?.sender_address || !!tx?.nonce) && (
                  <>
                    <Separator />
                    <CardContent className="px-0 gap-[8px]">
                      {!!tx?.sender_address && (
                        <div className="flex flex-col justify-between gap-[8px]">
                          <CardLabel>Sender</CardLabel>
                          <div
                            className="bg-background-200 hover:bg-[#2B2F2C] rounded-sm py-[4px] px-[10px] border border-[#454B46] cursor-pointer"
                            onClick={onCopySenderAddress}
                          >
                            <Hash value={tx?.sender_address} />
                          </div>
                        </div>
                      )}
                      {!!tx?.nonce && (
                        <div className="flex justify-between gap-2">
                          <CardLabel>Nonce</CardLabel>
                          <p className="text-[13px] font-mono font-medium text-foreground-200 max-w-xs break-all">
                            {Number(tx?.nonce)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </>
                )}

                {!!tx?.tip && (
                  <>
                    <Separator />
                    <div className="flex justify-between gap-2">
                      <CardLabel>Tip</CardLabel>
                      <p className="text-[13px] font-mono font-medium text-foreground-200 max-w-xs break-all">
                        {Number(tx?.tip).toLocaleString()}
                      </p>
                    </div>
                  </>
                )}
                {!!tx?.max_fee && (
                  <>
                    <Separator />
                    <div className="flex justify-between gap-2">
                      <CardLabel>Tip</CardLabel>
                      <p className="text-[13px] font-mono font-medium text-foreground-200 max-w-xs break-all">
                        {Number(tx?.max_fee).toLocaleString()}
                      </p>
                    </div>
                  </>
                )}

                {Number(tx?.version) === 3 && (
                  <>
                    <Separator />
                    <CardHeader className="px-0 mb-[15px]">
                      <GasIcon />
                      <CardTitle>Resource Bounds</CardTitle>
                    </CardHeader>

                    <CardContent className="gap-[15px] px-0">
                      <div className="space-y-[8px]">
                        <CardLabel>L1 execution gas</CardLabel>

                        <div className="flex items-center gap-px">
                          <PriceCard
                            label="Max amount"
                            value={Number(
                              cairo.felt(
                                tx?.resource_bounds?.l1_gas?.max_amount ?? 0,
                              ),
                            )}
                            unit="strk"
                            onClick={() =>
                              onCopyValue(
                                tx?.resource_bounds?.l1_gas?.max_amount ?? "0",
                              )
                            }
                          />
                          <PriceCard
                            label="Max price / unit"
                            value={ConvertToSTRK(
                              Number(
                                cairo.felt(
                                  tx?.resource_bounds?.l1_gas
                                    ?.max_price_per_unit ?? 0,
                                ),
                              ),
                            )}
                            unit="strk"
                            onClick={() =>
                              onCopyValue(
                                tx?.resource_bounds?.l1_gas
                                  ?.max_price_per_unit ?? "0",
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-[8px]">
                        <CardLabel>L2 execution gas</CardLabel>

                        <div className="flex items-center gap-px">
                          <PriceCard
                            label="Max amount"
                            value={Number(
                              cairo.felt(
                                tx?.resource_bounds?.l2_gas?.max_amount ?? 0,
                              ),
                            )}
                            unit="strk"
                            onClick={() =>
                              onCopyValue(
                                tx?.resource_bounds?.l2_gas?.max_amount ?? "0",
                              )
                            }
                          />
                          <PriceCard
                            label="Max price / unit"
                            value={ConvertToSTRK(
                              Number(
                                cairo.felt(
                                  tx?.resource_bounds?.l2_gas
                                    ?.max_price_per_unit ?? 0,
                                ),
                              ),
                            )}
                            unit="strk"
                            onClick={() =>
                              onCopyValue(
                                tx?.resource_bounds?.l2_gas
                                  ?.max_price_per_unit ?? "0",
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-[8px]">
                        <CardLabel>L1 data gas</CardLabel>

                        <div className="flex items-center gap-px">
                          <PriceCard
                            label="Max amount"
                            value={Number(
                              cairo.felt(
                                tx?.resource_bounds?.l1_data_gas?.max_amount ??
                                  0,
                              ),
                            )}
                            unit="strk"
                            onClick={() =>
                              onCopyValue(
                                tx?.resource_bounds?.l1_data_gas?.max_amount ??
                                  "0",
                              )
                            }
                          />
                          <PriceCard
                            label="Max price / unit"
                            value={ConvertToSTRK(
                              Number(
                                cairo.felt(
                                  tx?.resource_bounds?.l1_data_gas
                                    ?.max_price_per_unit ?? 0,
                                ),
                              ),
                            )}
                            unit="strk"
                            onClick={() =>
                              onCopyValue(
                                tx?.resource_bounds?.l1_data_gas
                                  ?.max_price_per_unit ?? "0",
                              )
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </>
                )}

                {!!(
                  tx?.fee_data_availability_mode ??
                  tx?.nonce_data_availability_mode
                ) && (
                  <>
                    <Separator />

                    <div className="space-y-[13px]">
                      <CardHeader className="px-0">
                        <ServerIcon />
                        <CardTitle>Data Availability Mode</CardTitle>
                      </CardHeader>

                      <CardContent className="px-0">
                        <div className="flex justify-between gap-2">
                          <CardLabel>Nonce</CardLabel>
                          <p className="text-[13px] font-mono font-medium text-foreground-200 max-w-xs break-all">
                            {tx.nonce_data_availability_mode}
                          </p>
                        </div>
                        <div className="flex justify-between gap-2">
                          <CardLabel>Fee</CardLabel>
                          <p className="text-[13px] font-mono font-medium text-foreground-200 max-w-xs break-all">
                            {tx.fee_data_availability_mode}
                          </p>
                        </div>
                      </CardContent>
                    </div>
                  </>
                )}
              </Card>
            </div>

            <Card className="h-full flex-grow grid grid-rows-[min-content_1fr] overflow-x-scroll sl:min-w-[794px]">
              {tx ? (
                <Tabs
                  value={tab.selected}
                  onValueChange={tab.onChange}
                  className="h-full"
                >
                  <CardContent>
                    <TabsList>
                      {tx?.type === "INVOKE" && (
                        <TabsTrigger
                          value="calldata"
                          className="data-[state=active]:shadow-none"
                        >
                          <ListIcon variant="solid" />
                          <div>Calldata</div>
                        </TabsTrigger>
                      )}
                      {tx?.type === "DECLARE" && (
                        <TabsTrigger
                          value="class"
                          className="data-[state=active]:shadow-none select-none"
                        >
                          <ListIcon variant="solid" />
                          <div>Class</div>
                        </TabsTrigger>
                      )}
                      <TabsTrigger
                        value="signature"
                        className="data-[state=active]:shadow-none select-none"
                      >
                        <PencilIcon variant="solid" />
                        <div>Signature</div>
                      </TabsTrigger>
                      <TabsTrigger
                        value="events"
                        className="data-[state=active]:shadow-none select-none"
                      >
                        <PulseIcon variant="solid" />
                        <div>Events</div>
                      </TabsTrigger>
                      <TabsTrigger
                        value="storage-diffs"
                        className="data-[state=active]:shadow-none select-none"
                      >
                        <StackOvalIcon variant="solid" />
                        <div>Storage Diffs</div>
                      </TabsTrigger>
                    </TabsList>
                  </CardContent>
                  <Separator className="mt-1 mb-0" />

                  <CardContent className="p-[15px]">
                    {tx?.type === "INVOKE" && (
                      <TabsContent value="calldata" className="mt-0">
                        <Calldata tx={tx} />
                      </TabsContent>
                    )}
                    {tx?.type === "DECLARE" && !!declared && (
                      <TabsContent
                        value="class"
                        className="flex flex-col gap-4 mt-0"
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
                    <TabsContent value="signature" className="mt-0">
                      <UITabs defaultValue="hex">
                        <UITabsList>
                          <UITabsTrigger value="decoded">Dec</UITabsTrigger>
                          <UITabsTrigger value="hex">Hex</UITabsTrigger>
                        </UITabsList>
                        <UITabsContent value="hex" className="mt-[15px]">
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
                    <TabsContent value="events" className="mt-0">
                      <DataTable table={events} />
                    </TabsContent>
                    <TabsContent value="storage-diffs" className="mt-0">
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

const Separator = memo(() => (
  <span>
    <CardSeparator className="my-[10px] relative left-[-15px] w-[calc(100%+30px)]" />
  </span>
));

const PriceCard = ({
  label,
  value,
  unit,
  className,
  onClick,
}: {
  label: string;
  value: string | number;
  unit: string;
  className?: string;
  onClick?: () => void;
}) => {
  return (
    <button
      type="button"
      className={cn(
        "bg-background-200 hover:bg-background-300 p-[12px] flex-1 flex flex-col items-start w-full gap-1",
        className,
      )}
      onClick={onClick}
    >
      <CardLabel>{label}</CardLabel>
      <div className="flex items-center justify-between w-full">
        <p className="text-[13px] font-mono font-medium text-foreground-200 max-w-xs break-all">
          {Number(value) === 0 ? "-" : value}
        </p>
        <Badge className="uppercase bg-background-500 text-[10px]/[12px] font-medium px-[5px] py-[3px] pointer-events-none">
          {unit}
        </Badge>
      </div>
    </button>
  );
};

const ServerIcon = memo(() => {
  return (
    <svg viewBox="0 0 11 11" fill="none" className="w-[11px] h-[11px]">
      <path
        d="M9.77778 6.11111H1.22222C0.55 6.11111 0 6.66111 0 7.33333V9.77778C0 10.45 0.55 11 1.22222 11H9.77778C10.45 11 11 10.45 11 9.77778V7.33333C11 6.66111 10.45 6.11111 9.77778 6.11111ZM2.44444 9.77778C1.77222 9.77778 1.22222 9.22778 1.22222 8.55556C1.22222 7.88333 1.77222 7.33333 2.44444 7.33333C3.11667 7.33333 3.66667 7.88333 3.66667 8.55556C3.66667 9.22778 3.11667 9.77778 2.44444 9.77778ZM9.77778 0H1.22222C0.55 0 0 0.55 0 1.22222V3.66667C0 4.33889 0.55 4.88889 1.22222 4.88889H9.77778C10.45 4.88889 11 4.33889 11 3.66667V1.22222C11 0.55 10.45 0 9.77778 0ZM2.44444 3.66667C1.77222 3.66667 1.22222 3.11667 1.22222 2.44444C1.22222 1.77222 1.77222 1.22222 2.44444 1.22222C3.11667 1.22222 3.66667 1.77222 3.66667 2.44444C3.66667 3.11667 3.11667 3.66667 2.44444 3.66667Z"
        fill="white"
      />
    </svg>
  );
});
