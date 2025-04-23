import { useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import { truncateString } from "@/shared/utils/string";
import { useCallback, useEffect, useState } from "react";
import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { Contract } from "starknet";
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
import { ContractReadInterface } from "@/shared/components/contract/ReadContractInterface";
import { ContractWriteInterface } from "@/shared/components/contract/WriteContractInterface";
import { parseClassFunctions } from "@/shared/utils/contract";
import { Function } from "@/shared/components/contract/types";
import { Code, CodeProps } from "@/shared/components/contract/Code";

const DataTabs = ["Read Contract", "Write Contract", "Code"];

export default function ContractDetails() {
  const { contractAddress } = useParams<{
    contractAddress: string;
  }>();
  const { isMobile } = useScreen();
  const [selectedDataTab, setSelectedDataTab] = useState(DataTabs[0]);
  const [classHash, setClassHash] = useState<string | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [readFunctions, setReadFunctions] = useState<Function[]>([]);
  const [writeFunctions, setWriteFunctions] = useState<Function[]>([]);
  const [codeProps, setCodeProps] = useState<CodeProps>();

  const fetchContractDetails = useCallback(async () => {
    if (!contractAddress) return;

    // get class hash
    const classHash = await RPC_PROVIDER.getClassHashAt(contractAddress);
    setClassHash(classHash);

    // process contract functions
    const contractClass = await RPC_PROVIDER.getClassAt(contractAddress);
    setCodeProps({
      abi: JSON.stringify(contractClass.abi, null, 2),
      sierra: "sierra_program" in contractClass ? JSON.stringify(contractClass.sierra_program, null, 2) : undefined,
    });
    const { readFuncs, writeFuncs } = parseClassFunctions(contractClass);

    setReadFunctions(readFuncs);
    setWriteFunctions(writeFuncs);

    const contract = new Contract(
      contractClass.abi,
      contractAddress,
      RPC_PROVIDER
    );
    setContract(contract);
  }, [contractAddress]);

  useEffect(() => {
    if (!contractAddress) return;
    fetchContractDetails();
  }, [contractAddress, fetchContractDetails]);

  const { balances, isStrkLoading, isEthLoading } =
    useBalances(contractAddress);

  return (
    <div className="w-full flex-grow gap-8">
      <div className="mb-2">
        <Breadcrumb>
          <BreadcrumbItem href="/">Explorer</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem href="/">Contracts</BreadcrumbItem>
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
              {isMobile && classHash ? truncateString(classHash) : classHash}
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
            selected={DataTabs[0]}
            onTabSelect={setSelectedDataTab}
            items={DataTabs.map((tab) => ({
              name: tab,
              value: tab,
            }))}
          />

          <div className="bg-white flex flex-col gap-3 mt-[6px] px-[15px] py-[17px] border border-borderGray overflow-auto">
            <div className="w-full h-full overflow-auto">
              {(() => {
                if (!contract) {
                  return null
                }

                switch (selectedDataTab) {
                  case "Read Contract":
                    return <ContractReadInterface
                      contract={contract}
                      functions={readFunctions}
                    />
                  case "Write Contract":
                    return <ContractWriteInterface
                      contract={contract}
                      functions={writeFunctions}
                    />
                  case "Code":
                    return <Code {...codeProps} />
                  default:
                    return (
                      <div className="h-full p-2 flex items-center justify-center min-h-[150px] text-xs lowercase">
                        <span className="text-[#D0D0D0]">No data found</span>
                      </div>
                    )
                }
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
