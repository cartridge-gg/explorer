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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  Skeleton,
} from "@cartridge/ui";
import { DataTable } from "@/shared/components/dataTable";
import DetailsPageSelector from "@/shared/components/DetailsPageSelector";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionBoxEntry } from "@/shared/components/section";
import { SectionBox } from "@/shared/components/section/SectionBox";
import dayjs from "dayjs";
import SignatureDisplay from "./components/SignatureDisplay";
import AddressDisplay from "@/shared/components/AddressDisplay";
import BlockIdDisplay from "@/shared/components/BlockIdDisplay";
import { cn } from "@cartridge/ui/utils";
import { TxType } from "./components/TxType";
import { NotFound } from "../NotFound/page";
import { Loading } from "@/shared/components/Loading";
import { useTransaction } from "./hooks";
import { useHashLinkTabs } from "@/shared/hooks/useHashLinkTabs";

export function Transaction() {
  const { selected, onTabChange, tabs } = useHashLinkTabs([
    "Calldata",
    "Events",
    "Signature",
    "Storage Diffs",
  ]);
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
    <div id="tx-details" className="w-full flex flex-col gap-4">
      <Breadcrumb>
        <BreadcrumbList className="font-bold">
          <BreadcrumbItem>
            <BreadcrumbLink href="..">Explorer</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="../txns">Transactions</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {isMobile && txHash ? truncateString(txHash) : txHash}
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
          <SectionBox>
            <SectionBoxEntry title="Hash">
              {isMobile
                ? truncateString(receipt?.transaction_hash)
                : receipt?.transaction_hash}
            </SectionBoxEntry>

            <SectionBoxEntry title="Block">
              <BlockIdDisplay value={receipt?.block_number} />
            </SectionBoxEntry>
          </SectionBox>

          {(!!tx?.sender_address || !!tx?.nonce) && (
            <SectionBox title="Sender">
              {!!tx?.sender_address && (
                <SectionBoxEntry title="Address">
                  <AddressDisplay value={tx?.sender_address} />
                </SectionBoxEntry>
              )}

              {!!tx?.nonce && (
                <SectionBoxEntry title="Nonce">
                  {Number(tx?.nonce)}
                </SectionBoxEntry>
              )}
            </SectionBox>
          )}

          <SectionBox title="Resource Bounds">
            <SectionBoxEntry title="L1 Gas Prices" bold={false}>
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
            </SectionBoxEntry>
            <SectionBoxEntry title="L2 Gas Prices" bold={false}>
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
            </SectionBoxEntry>
          </SectionBox>

          {tx?.fee_data_availability_mode ||
          tx?.nonce_data_availability_mode ? (
            <SectionBox title="DA Mode">
              <table className="w-full">
                <tbody>
                  {tx?.fee_data_availability_mode ? (
                    <tr>
                      <th className="w-1/3">Fee</th>
                      <td>{tx.fee_data_availability_mode}</td>
                    </tr>
                  ) : null}

                  {tx?.nonce_data_availability_mode ? (
                    <tr>
                      <th className="w-1/3">Nonce</th>
                      <td>{tx.nonce_data_availability_mode}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </SectionBox>
          ) : null}

          {tx?.tip ? <SectionBox title="Tip">{tx.tip}</SectionBox> : null}

          <SectionBox title="Actual Fee">
            {receipt?.actual_fee?.amount
              ? formatNumber(Number(cairo.felt(receipt?.actual_fee?.amount)))
              : 0}{" "}
            {receipt?.actual_fee?.unit}
          </SectionBox>

          <SectionBox title="Execution Resources" variant="full">
            <table className="w-full mb-1">
              <thead>
                <tr>
                  <th colSpan={2}>GAS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th className="w-[90px]">L1 GAS</th>
                  <td>{formatNumber(blockComputeData.gas)}</td>
                </tr>
                <tr>
                  <th className="w-min">L1 DA GAS</th>
                  <td>{formatNumber(blockComputeData.data_gas)}</td>
                </tr>
              </tbody>
            </table>

            <table className="w-full mb-1">
              <thead>
                <tr>
                  <th>STEPS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{formatNumber(blockComputeData.steps)}</td>
                </tr>
              </tbody>
            </table>

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
          </SectionBox>
        </div>

        <div className="h-full flex-grow grid grid-rows-[min-content_1fr]">
          <DetailsPageSelector
            selected={selected}
            onTabSelect={onTabChange}
            items={tabs}
          />

          <div className="flex-grow flex flex-col gap-3 mt-[6px] px-[15px] py-[17px] border border-borderGray overflow-auto">
            {(() => {
              switch (selected) {
                case "Calldata":
                  return <CalldataDisplay calldata={calldata} />;
                case "Events":
                  return (
                    <div className="h-full">
                      <DataTable
                        table={events.table}
                        pagination={events.pagination}
                        setPagination={events.setPagination}
                      />
                    </div>
                  );
                case "Signature":
                  return tx?.signature ? (
                    <SignatureDisplay signature={tx.signature} />
                  ) : null;
                case "Storage Diffs":
                  return (
                    <div className="h-full">
                      <DataTable
                        table={storageDiff.table}
                        pagination={storageDiff.pagination}
                        setPagination={storageDiff.setPagination}
                      />
                    </div>
                  );
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
