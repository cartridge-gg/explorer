import { useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import { truncateString } from "@/shared/utils/string";
import { RPC_PROVIDER } from "@/services/rpc";
import { Contract as StarknetContract } from "starknet";
import {
  BookIcon,
  CoinsIcon,
  PencilIcon,
  CodeIcon,
  ScrollIcon,
} from "@cartridge/ui";
import { PageHeader, PageHeaderTitle } from "@/shared/components/PageHeader";
import { useBalances } from "@/shared/hooks/useBalances";
import {
  getContractClassInfo,
  ContractClassInfo,
  isValidAddress,
} from "@/shared/utils/contract";
import { CodeCard } from "@/shared/components/contract/Code";
import { useQuery } from "@tanstack/react-query";
import { ContractForm } from "@/shared/components/contract/Form";
import { useHashLinkTabs } from "@/shared/hooks/useHashLinkTabs";
import { Loading } from "@/shared/components/Loading";
import { NotFound } from "../NotFound/page";
import {
  Card,
  CardContent,
  CardHeader,
  CardIcon,
  CardLabel,
  CardSeparator,
  CardTitle,
} from "@/shared/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/breadcrumb";
import { Hash } from "@/shared/components/hash";

const initialData: Omit<ContractClassInfo, "constructor"> & {
  classHash?: string;
  contract?: StarknetContract;
} = {
  classHash: undefined,
  contract: undefined,
  readFuncs: [],
  writeFuncs: [],
  code: {
    abi: "",
    sierra: undefined,
  },
};

export function Contract() {
  const { contractAddress } = useParams<{
    contractAddress: string;
  }>();
  const { isMobile } = useScreen();
  const tab = useHashLinkTabs("read");

  const {
    data: { classHash, contract, readFuncs, writeFuncs, code },
    isLoading,
    error,
  } = useQuery({
    queryKey: ["contractClass", contractAddress],
    queryFn: async () => {
      if (!contractAddress || !isValidAddress(contractAddress)) {
        throw new Error("Invalid contract address");
      }

      const [classHash, contractClass] = await Promise.all([
        RPC_PROVIDER.getClassHashAt(contractAddress),
        RPC_PROVIDER.getClassAt(contractAddress),
      ]);
      const { readFuncs, writeFuncs, code } =
        getContractClassInfo(contractClass);

      const contract = new StarknetContract(
        contractClass.abi,
        contractAddress!,
        RPC_PROVIDER,
      );

      return {
        classHash,
        contract,
        readFuncs,
        writeFuncs,
        code,
      };
    },
    initialData,
    retry: false,
  });

  const { balances, isStrkLoading, isEthLoading } = useBalances(
    contractAddress ?? "",
  );

  return (
    <div className="w-full flex flex-col gap-[3px] sl:w-[1134px]">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="..">Explorer</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Contracts</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-foreground-400 text-[12px]/[16px] font-normal">
              {isMobile && contractAddress
                ? truncateString(contractAddress)
                : contractAddress}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader>
        <PageHeaderTitle>
          <ScrollIcon variant="solid" />
          <div>Contract</div>
        </PageHeaderTitle>
      </PageHeader>

      {isLoading || (!error && (!classHash || !contract)) ? (
        <Loading />
      ) : error ? (
        <NotFound />
      ) : (
        <div className="flex flex-col gap-[3px] sl:w-[1134px]">
          {/* Contract Info Section */}
          <div className="flex flex-col gap-[6px]">
            <Card>
              <CardContent>
                <div className="flex justify-between gap-2">
                  <CardLabel>Address</CardLabel>
                  <Hash value={contractAddress} />
                </div>

                <div className="flex justify-between gap-2">
                  <CardLabel>Class Hash</CardLabel>
                  <Hash value={classHash} to={`../class/${classHash}`} />
                </div>
              </CardContent>

              <CardSeparator />

              <CardHeader>
                <CardIcon icon={<CoinsIcon variant="solid" />} />
                <CardTitle>Balances</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex justify-between gap-2">
                  <CardLabel>STRK</CardLabel>
                  <div>
                    {isStrkLoading
                      ? "0.00"
                      : balances.strk !== undefined
                        ? (Number(balances.strk) / 10 ** 18).toString()
                        : "N/A"}
                  </div>
                </div>

                <div className="flex justify-between gap-2">
                  <CardLabel>ETH</CardLabel>
                  <div>
                    {isEthLoading
                      ? "0.00"
                      : balances.eth !== undefined
                        ? (Number(balances.eth) / 10 ** 18).toString()
                        : "N/A"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="h-full flex-grow grid grid-rows-[min-content_1fr] mt-[6px]">
            <CardContent>
              <Tabs value={tab.selected} onValueChange={tab.onChange}>
                <TabsList>
                  <TabsTrigger value="read">
                    <BookIcon variant="solid" />
                    <div>Read Contract</div>
                  </TabsTrigger>
                  <TabsTrigger value="write">
                    <PencilIcon variant="solid" />
                    <div>Write Contract</div>
                  </TabsTrigger>
                  <TabsTrigger value="code">
                    <CodeIcon variant="solid" />
                    <div>Code</div>
                  </TabsTrigger>
                </TabsList>
                <CardSeparator />

                <CardContent>
                  <TabsContent value="read">
                    <ContractForm functions={readFuncs} contract={contract} />
                  </TabsContent>

                  <TabsContent value="write">
                    <ContractForm functions={writeFuncs} contract={contract} />
                  </TabsContent>

                  <TabsContent value="code">
                    <CodeCard abi={code.abi} sierra={code.sierra} />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
