import { formatNumber } from "@/shared/utils/number";
import { formatSnakeCaseToDisplayValue } from "@/shared/utils/string";
import { cairo } from "starknet";
import {
  GasIcon,
  BoltIcon,
  StackDiamondIcon,
  BellIcon,
  ArrowIcon,
  cn,
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

  if (isLoading || (!error && !block)) {
    return <Loading />;
  }

  if (error || !block) {
    return <NotFound />;
  }

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
          <div>Block {block.block_number}</div>
        </PageHeaderTitle>

        <PageHeaderRight>
          <Link
            className={cn(
              "bg-background border-l border-background-200 text-foreground size-10 flex items-center justify-center cursor-pointer hover:bg-background-200",
              block.block_number === 0 &&
                "cursor-not-allowed pointer-events-none text-foreground-300",
            )}
            to={{
              pathname: `../block/${block.block_number - 1}`,
              hash,
            }}
          >
            <ArrowIcon variant="left" />
          </Link>
          <Link
            className={cn(
              "bg-background border-l border-background-200 text-foreground size-10 flex items-center justify-center hover:bg-background-200",
              isLatestBlock &&
                "cursor-not-allowed pointer-events-none text-foreground-300",
            )}
            to={{
              pathname: `../block/${block.block_number + 1}`,
              hash,
            }}
          >
            <ArrowIcon variant="right" />
          </Link>
        </PageHeaderRight>
      </PageHeader>

      <div className="flex flex-col sl:flex-row sl:h-[73vh] gap-4">
        <div className="sl:w-[468px] sl:min-w-[468px] flex flex-col gap-[6px] sl:overflow-y-scroll">
          <Card>
            <CardContent>
              <div className="flex justify-between gap-2">
                <CardLabel>Hash</CardLabel>
                <Hash value={block.block_hash} />
              </div>
            </CardContent>

            <CardSeparator />

            <CardContent>
              <div className="flex justify-between">
                <CardLabel>State root</CardLabel>
                <Hash value={block.new_root} />
              </div>

              <div className="flex justify-between">
                <CardLabel>Sequencer address</CardLabel>
                <Hash
                  value={block.sequencer_address}
                  to={`../contract/${block.sequencer_address}`}
                />
              </div>
            </CardContent>

            <CardSeparator />

            <CardHeader>
              <CardIcon icon={<GasIcon />} />
              <CardTitle>gas prices</CardTitle>
            </CardHeader>

            <CardContent>
              <CardLabel>L1 Gas Prices</CardLabel>
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

              <CardLabel>L1 Data Gas Prices</CardLabel>
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
            </CardContent>

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

              <CardLabel>Builtins Counter</CardLabel>
              <table className="w-full border-collapse">
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
          <Tabs defaultValue="transactions" onValueChange={onTabChange}>
            <TabsList>
              <TabsTrigger value="transactions">
                <StackDiamondIcon variant="solid" />
                <div>Transactions</div>
              </TabsTrigger>
              <TabsTrigger value="events">
                <BellIcon variant="solid" />
                <div>Events</div>
              </TabsTrigger>
            </TabsList>

            <Card>
              <CardContent>
                <TabsContent value="transactions">
                  <TxList transactions={txs} />
                </TabsContent>
                <TabsContent value="events">
                  <EventList events={events} />
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
