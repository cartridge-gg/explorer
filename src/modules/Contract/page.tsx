import { Link, useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import { truncateString } from "@/shared/utils/string";
import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { Contract as StarknetContract } from "starknet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  CoinsIcon,
} from "@cartridge/ui";
import DetailsPageSelector from "@/shared/components/DetailsPageSelector";
import { PageHeader } from "@/shared/components/PageHeader";
import useBalances from "@/shared/hooks/useBalances";
import {
  getContractClassInfo,
  ContractClassInfo,
  isValidAddress,
} from "@/shared/utils/contract";
import { Code } from "@/shared/components/contract/Code";
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
  const { selected, onTabChange, tabs } = useHashLinkTabs([
    "Read Contract",
    "Write Contract",
    "Code",
  ]);

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

  if (isLoading || (!error && (!classHash || !contract))) {
    return <Loading />;
  }

  if (error) {
    return <NotFound />;
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <Breadcrumb>
        <BreadcrumbList className="font-bold">
          <BreadcrumbItem>
            <BreadcrumbLink href="..">Explorer</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="../contracts">Contracts</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-bold">
              {isMobile && contractAddress
                ? truncateString(contractAddress)
                : contractAddress}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader title="Contract" />

      <div className="flex flex-col sl:flex-row sl:h-[76vh] gap-4">
        {/* Contract Info Section */}
        <div className="sl:w-[468px] flex flex-col gap-[6px] sl:overflow-y-scroll">
          <Card>
            <CardContent>
              <div className="flex justify-between gap-2">
                <CardLabel>Address</CardLabel>
                <div>
                  {isMobile && contractAddress
                    ? truncateString(contractAddress)
                    : contractAddress}
                </div>
              </div>

              <div className="flex justify-between gap-2">
                <CardLabel>Class Hash</CardLabel>
                <div>
                  <Link
                    to={`../class/${classHash}`}
                    className="hover:underline"
                  >
                    {isMobile && classHash
                      ? truncateString(classHash)
                      : classHash}
                  </Link>
                </div>
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

        <div className="h-full flex-grow grid grid-rows-[min-content_1fr]">
          <DetailsPageSelector
            selected={selected}
            onTabSelect={onTabChange}
            items={tabs}
          />

          <div className="bg-white flex flex-col gap-3 mt-[6px] px-[15px] py-[17px] border border-borderGray overflow-auto">
            <div className="w-full h-full overflow-auto">
              {(() => {
                if (!contract) {
                  return null;
                }

                switch (selected) {
                  case "Read Contract":
                    return (
                      <ContractForm functions={readFuncs} contract={contract} />
                    );
                  case "Write Contract":
                    return (
                      <ContractForm
                        functions={writeFuncs}
                        contract={contract}
                      />
                    );
                  case "Code":
                    return <Code abi={code.abi} sierra={code.sierra} />;
                  default:
                    return (
                      <div className="h-full p-2 flex items-center justify-center min-h-[150px] text-xs lowercase">
                        <span className="text-[#D0D0D0]">No data found</span>
                      </div>
                    );
                }
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
