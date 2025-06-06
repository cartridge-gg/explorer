import { Link, useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import { truncateString } from "@/shared/utils/string";
import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { Contract as StarknetContract } from "starknet";
import { BreadcrumbPage } from "@cartridge/ui-next";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbSeparator,
} from "@/shared/components/breadcrumbs";

import DetailsPageSelector from "@/shared/components/DetailsPageSelector";
import PageHeader from "@/shared/components/PageHeader";
import { SectionBox } from "@/shared/components/section/SectionBox";
import { SectionBoxEntry } from "@/shared/components/section";
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
    <div id="contract-details" className="w-full flex-grow gap-8">
      <div className="mb-2">
        <Breadcrumb>
          <BreadcrumbItem to="..">Explorer</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Contracts</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className=" text-sm">
              {isMobile && contractAddress
                ? truncateString(contractAddress)
                : contractAddress}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </Breadcrumb>
      </div>

      <PageHeader className="mb-6" title="Contract" />

      <div className="flex flex-col sl:flex-row sl:h-[76vh] gap-4">
        {/* Contract Info Section */}
        <div className="sl:w-[468px] flex flex-col gap-[6px] sl:overflow-y-scroll">
          <SectionBox>
            <SectionBoxEntry title="Address">
              {isMobile && contractAddress
                ? truncateString(contractAddress)
                : contractAddress}
            </SectionBoxEntry>

            <SectionBoxEntry title="Class Hash">
              <Link to={`../class/${classHash}`} className="hover:underline">
                {isMobile && classHash ? truncateString(classHash) : classHash}
              </Link>
            </SectionBoxEntry>
          </SectionBox>

          <SectionBox title="Balances">
            <table className="w-full">
              <tbody>
                <tr>
                  <th className="text-left w-[53px] bg-white font-bold">
                    STRK
                  </th>
                  <td className="text-left">
                    {isStrkLoading
                      ? "0.00"
                      : balances.strk !== undefined
                        ? (Number(balances.strk) / 10 ** 18).toString()
                        : "N/A"}
                  </td>
                </tr>

                <tr>
                  <th className="text-left bg-white font-bold">ETH</th>
                  <td className="text-left">
                    {isEthLoading
                      ? "0.00"
                      : balances.eth !== undefined
                        ? (Number(balances.eth) / 10 ** 18).toString()
                        : "N/A"}
                  </td>
                </tr>
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
