import { formatNumber } from "@/shared/utils/number";
import {
  formatSnakeCaseToDisplayValue,
  truncateString,
} from "@/shared/utils/string";
import dayjs from "dayjs";
import { cairo } from "starknet";
import { useScreen } from "@/shared/hooks/useScreen";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@cartridge/ui";
import { PageHeader } from "@/shared/components/PageHeader";
import { SectionBox } from "@/shared/components/section/SectionBox";
import { SectionBoxEntry } from "@/shared/components/section";
import { TxList } from "./TxList";
import { EventList } from "./EventList";
import DetailsPageSelector from "@/shared/components/DetailsPageSelector";
import { BlockNavigation } from "./BlockNavigation";
import AddressDisplay from "@/shared/components/AddressDisplay";
import { NotFound } from "../NotFound/page";
import { useHashLinkTabs } from "@/shared/hooks/useHashLinkTabs";
import { Loading } from "@/shared/components/Loading";
import { useBlock } from "./hooks";

export function Block() {
  const { isMobile } = useScreen();
  const { selected, onTabChange, tabs } = useHashLinkTabs([
    "Transactions",
    "Events",
    "Messages",
    "State Updates",
  ]);
  const {
    data: { blockId, block, txs, events, executions, blockComputeData },
    isLoading,
    error,
  } = useBlock();

  if (isLoading || (!error && !block)) {
    return <Loading />;
  }

  if (error || !block) {
    return <NotFound />;
  }

  return (
    <div id="block-details" className="w-full flex-grow gap-8">
      <div className="flex justify-between">
        <Breadcrumb>
          <BreadcrumbList className="font-bold">
            <BreadcrumbItem>
              <BreadcrumbLink href="..">Explorer</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="../blocks">Blocks</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-bold">{blockId}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <BlockNavigation currentBlockNumber={block.block_number} />
      </div>

      <PageHeader
        className="mb-6"
        title={`Block #${block.block_number}`}
        subtext={block.status}
        subtextRightComponent={
          <div className="text-[#5D5D5D]">
            {block.timestamp
              ? dayjs.unix(block.timestamp).format("MMM D YYYY HH:mm:ss")
              : ""}
          </div>
        }
      />

      <div className="flex flex-col sl:flex-row sl:h-[73vh] gap-4">
        <div className="sl:w-[468px] sl:min-w-[468px] flex flex-col gap-[6px] sl:overflow-y-scroll">
          <SectionBox>
            <SectionBoxEntry title="Hash">
              {isMobile ? truncateString(block.block_hash) : block.block_hash}
            </SectionBoxEntry>

            <SectionBoxEntry title="Number">
              {block.block_number}
            </SectionBoxEntry>

            <SectionBoxEntry title="State root">
              {isMobile ? truncateString(block.new_root) : block.new_root}
            </SectionBoxEntry>

            <SectionBoxEntry title="Sequencer address">
              <AddressDisplay value={block.sequencer_address} />
            </SectionBoxEntry>
          </SectionBox>

          <SectionBox title="Gas Prices">
            <SectionBoxEntry title="L1 Gas Prices" bold={false}>
              <table className="w-full">
                <tbody>
                  <tr>
                    <th className="w-[67px]">ETH</th>
                    <td>
                      {block.l1_gas_price
                        ? formatNumber(
                            Number(cairo.felt(block.l1_gas_price.price_in_wei)),
                          )
                        : 0}{" "}
                      WEI
                    </td>
                  </tr>
                  <tr>
                    <th className="w-min">STRK</th>
                    <td>
                      {block.l1_gas_price
                        ? formatNumber(
                            Number(cairo.felt(block.l1_gas_price.price_in_fri)),
                          )
                        : 0}{" "}
                      FRI
                    </td>
                  </tr>
                </tbody>
              </table>
            </SectionBoxEntry>

            <SectionBoxEntry title="L1 Data Gas Prices" bold={false}>
              <table className="w-full">
                <tbody>
                  <tr>
                    <th className="w-[67px]">ETH</th>
                    <td>
                      {block.l1_data_gas_price
                        ? formatNumber(
                            Number(
                              cairo.felt(block.l1_data_gas_price?.price_in_wei),
                            ),
                          )
                        : 0}{" "}
                      ETH
                    </td>
                  </tr>
                  <tr>
                    <th className="w-min">STRK</th>
                    <td>
                      {block.l1_data_gas_price
                        ? formatNumber(
                            Number(
                              cairo.felt(block.l1_data_gas_price?.price_in_fri),
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

          <SectionBox title="Execution Resources">
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
                  <th colSpan={4} className="p-1 bg-gray-100 border">
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

          <div className="bg-white flex flex-col gap-3 mt-[6px] px-[15px] py-[17px] border border-borderGray">
            <div className="w-full h-full">
              {(() => {
                switch (selected) {
                  case "Transactions":
                    return <TxList transactions={txs} />;
                  case "Events":
                    return <EventList events={events} />;
                  default:
                    <div className="h-full p-2 flex items-center justify-center min-h-[150px] text-xs lowercase">
                      <span className="text-[#D0D0D0]">No data found</span>
                    </div>;
                }
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
