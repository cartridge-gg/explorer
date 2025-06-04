import { formatNumber } from "@/shared/utils/number";
import {
  formatSnakeCaseToDisplayValue,
  truncateString,
} from "@/shared/utils/string";
import { useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import { cairo } from "starknet";
import CalldataDisplay from "./components/CalldataDisplay";
import {
  cn,
  BoltIcon,
  CoinsIcon,
  GasIcon,
  Skeleton,
  CodeIcon,
  PencilIcon,
  BellIcon,
  StackOvalIcon,
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
import { DataTable } from "@/shared/components/dataTable";
import { PageHeader } from "@/shared/components/PageHeader";
import dayjs from "dayjs";
import SignatureDisplay from "./components/SignatureDisplay";
import { TxType } from "./components/TxType";
import { NotFound } from "../NotFound/page";
import { Loading } from "@/shared/components/Loading";
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

export function Transaction() {
  const { onTabChange } = useHashLinkTabs();
  const { txHash } = useParams<{ txHash: string }>();
  const {
    isLoading,
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

  if (isLoading || (!error && !tx)) {
    return <Loading />;
  }

  if (error) {
    return <NotFound />;
  }

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
            <BreadcrumbPage>
              {isMobile && txHash ? truncateString(txHash) : txHash}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        className="mb-6"
        title={`Transaction`}
        subtext={receipt?.finality_status ?? <Skeleton className="h-4 w-20" />}
        titleRightComponent={
          <div className="flex gap-2">
            {receipt?.type ? <TxType type={receipt?.type} /> : null}

            <div
              className={cn(
                "px-2 h-5 w-[84px] flex items-center justify-center font-bold rounded-xs",
                receipt
                  ? receipt?.isSuccess()
                    ? "bg-[#7BA797]"
                    : "bg-[#C4806D]"
                  : undefined,
              )}
            >
              {receipt?.execution_status}
            </div>
          </div>
        }
        subtextRightComponent={
          <div>
            {block ? (
              dayjs.unix(block.timestamp).format("MMM D YYYY HH:mm:ss")
            ) : (
              <Skeleton className="h-4 w-20" />
            )}
          </div>
        }
      />

      <div className="flex flex-col sl:flex-row sl:h-[73vh] gap-4">
        <div className="sl:w-[468px] sl:min-w-[468px] flex flex-col gap-[6px] sl:overflow-y-scroll">
          <Card>
            <CardContent>
              <div className="flex justify-between gap-2">
                <CardLabel>Hash</CardLabel>
                <div>
                  <Hash value={receipt?.transaction_hash} />
                </div>
              </div>
              <div className="flex justify-between gap-2">
                <CardLabel>Block</CardLabel>
                <BlockIdDisplay value={receipt?.block_number} />
              </div>
            </CardContent>

            {(!!tx?.sender_address || !!tx?.nonce) && (
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
            )}

            <CardSeparator />

            <CardHeader>
              <CardIcon icon={<GasIcon />} />
              <CardTitle>Resource Bounds</CardTitle>
            </CardHeader>

            <CardContent>
              <CardLabel>L1 Gas Prices</CardLabel>
              <table className="w-full">
                <tbody>
                  <tr>
                    <th className="w-1/3">Max Amount</th>
                    <td>
                      {tx?.resource_bounds?.l1_gas?.max_amount
                        ? formatNumber(
                            Number(
                              cairo.felt(
                                tx?.resource_bounds?.l1_gas?.max_amount,
                              ),
                            ),
                          )
                        : 0}{" "}
                      WEI
                    </td>
                  </tr>
                  <tr>
                    <th className="w-1">Max Amount / Unit</th>
                    <td>
                      {tx?.resource_bounds?.l1_gas?.max_price_per_unit
                        ? formatNumber(
                            Number(
                              cairo.felt(
                                tx?.resource_bounds?.l1_gas?.max_price_per_unit,
                              ),
                            ),
                          )
                        : 0}{" "}
                      FRI
                    </td>
                  </tr>
                </tbody>
              </table>

              <CardLabel>L2 Gas Prices</CardLabel>
              <table className="w-full">
                <tbody>
                  <tr>
                    <th className="w-1/3">Max Amount</th>
                    <td>
                      {tx?.resource_bounds?.l2_gas?.max_amount
                        ? formatNumber(
                            Number(
                              cairo.felt(
                                tx?.resource_bounds?.l2_gas?.max_amount,
                              ),
                            ),
                          )
                        : 0}{" "}
                      WEI
                    </td>
                  </tr>
                  <tr>
                    <th className="w-1">Max Amount / Unit</th>
                    <td>
                      {tx?.resource_bounds?.l2_gas?.max_price_per_unit
                        ? formatNumber(
                            Number(
                              cairo.felt(
                                tx?.resource_bounds?.l2_gas?.max_price_per_unit,
                              ),
                            ),
                          )
                        : 0}{" "}
                      FRI
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>

            <CardSeparator />

            <CardContent>
              <div className="flex justify-between">
                <CardLabel>Actual Fee</CardLabel>
                <div>
                  {receipt?.actual_fee?.amount
                    ? formatNumber(
                        Number(cairo.felt(receipt?.actual_fee?.amount)),
                      )
                    : 0}{" "}
                  {receipt?.actual_fee?.unit}
                </div>
              </div>
            </CardContent>

            {!!(
              tx?.fee_data_availability_mode ?? tx?.nonce_data_availability_mode
            ) && (
              <>
                <CardSeparator />

                <CardHeader>
                  <CardIcon icon={<BoltIcon variant="solid" />} />
                  <CardTitle>DA Mode</CardTitle>
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

            <CardSeparator />

            <CardHeader>
              <CardIcon icon={<BoltIcon variant="solid" />} />
              <CardTitle>Execution Resources</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex justify-between">
                <CardLabel>L1 Gas</CardLabel>
                <div>{formatNumber(blockComputeData.gas)}</div>
              </div>

              <div className="flex justify-between">
                <CardLabel>L1 DA Gas</CardLabel>
                <div>{formatNumber(blockComputeData.data_gas)}</div>
              </div>

              <CardSeparator />

              <div className="flex justify-between">
                <CardLabel>Steps</CardLabel>
                <div>{formatNumber(blockComputeData.steps)}</div>
              </div>

              <CardSeparator />

              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th colSpan={4} className="p-1 border">
                      BUILTINS COUNTER
                    </th>
                  </tr>
                </thead>

                <tbody className="text-center">
                  {Object.entries(executions).map(
                    ([key, value], index, array) => {
                      const heading = formatSnakeCaseToDisplayValue(key);
                      return index % 2 === 0 ? (
                        <tr key={index} className="w-full">
                          <th className="w-[111px]">{heading}</th>
                          <td>{formatNumber(value)}</td>

                          {array[index + 1] ? (
                            <>
                              <th className="w-[111px]">
                                {formatSnakeCaseToDisplayValue(
                                  array[index + 1][0],
                                )}
                              </th>
                              <td>{formatNumber(array[index + 1][1])}</td>
                            </>
                          ) : (
                            <>
                              <th className="w-[111px]"></th>
                              <td></td>
                            </>
                          )}
                        </tr>
                      ) : null;
                    },
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="h-full flex-grow grid grid-rows-[min-content_1fr]">
          <Tabs
            defaultValue="calldata"
            onValueChange={onTabChange}
            className="h-full"
          >
            <TabsList>
              <TabsTrigger value="calldata">
                <CodeIcon variant="solid" />
                <div>Calldata</div>
              </TabsTrigger>
              <TabsTrigger value="events">
                <BellIcon variant="solid" />
                <div>Events</div>
              </TabsTrigger>
              <TabsTrigger value="signature">
                <PencilIcon variant="solid" />
                <div>Signature</div>
              </TabsTrigger>
              <TabsTrigger value="storage-diffs">
                <StackOvalIcon variant="solid" />
                <div>Storage Diffs</div>
              </TabsTrigger>
            </TabsList>

            <Card className="h-full flex flex-1">
              <CardContent>
                <TabsContent value="calldata">
                  <CalldataDisplay calldata={calldata} />
                </TabsContent>
                <TabsContent value="events">
                  <DataTable
                    table={events.table}
                    pagination={events.pagination}
                    setPagination={events.setPagination}
                  />
                </TabsContent>
                <TabsContent value="signature">
                  {!!tx?.signature && (
                    <SignatureDisplay signature={tx.signature} />
                  )}
                </TabsContent>
                <TabsContent value="storage-diffs">
                  <DataTable
                    table={storageDiff.table}
                    pagination={storageDiff.pagination}
                    setPagination={storageDiff.setPagination}
                  />
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
