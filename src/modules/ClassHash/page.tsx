import { truncateString } from "@/shared/utils/string";
import { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator } from "@/shared/components/breadcrumbs";
import { BreadcrumbPage } from "@cartridge/ui-next";
import { useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import PageHeader from "@/shared/components/PageHeader";
import { SectionBoxEntry } from "@/shared/components/section";
import { SectionBox } from "@/shared/components/section/SectionBox";
import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { useQuery } from "@tanstack/react-query";
import DetailsPageSelector from "@/shared/components/DetailsPageSelector";
import { useState, useEffect, useRef } from "react";
import { Overview } from "./Overview";
import { Deploy } from "./Deploy";
import { getContractClassInfo, ContractClassInfo } from "@/shared/utils/contract";
import { validateAndParseAddress } from "starknet";
import { useToast } from "@/shared/components/toast";
import NotFound from "../NotFound/page";
const DataTabs = ["Overview", "Deploy"];

const initialData: ContractClassInfo = {
  constructor: {
    inputs: []
  },
  readFuncs: [],
  writeFuncs: [],
  code: {
    abi: "",
    sierra: undefined
  }
};

export default function ClassHashDetails() {
  const { classHash } = useParams();
  const { isMobile } = useScreen();
  const [selectedDataTab, setSelectedDataTab] = useState(DataTabs[0]);

  const { data: contractVersion } = useQuery({
    queryKey: ["contractVersion", classHash],
    queryFn: () => RPC_PROVIDER.getContractVersion(undefined, classHash!),
    enabled: !!classHash,
  });

  const {
    data: { constructor, readFuncs, writeFuncs, code },
    isLoading,
    error
  } = useQuery({
    queryKey: ["contractClass", classHash],
    queryFn: async () => {
      if (!classHash) return initialData;
      const contractClass = await RPC_PROVIDER.getClassByHash(classHash!);
      return contractClass
        ? getContractClassInfo(contractClass)
        : initialData;
    },
    enabled: !!classHash,
    initialData,
  });

  const { toast } = useToast()

  const [classHashError, setClassHashError] = useState<Error>();
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (!isFirstRender.current) return
    isFirstRender.current = false
    try {
      if (!classHash) {
        throw new Error("Class hash is empty")
      }

      validateAndParseAddress(classHash)
    } catch (error) {
      setClassHashError(error as Error)
      toast(`Invalid class hash: ${classHash}`, "error")
    }
  }, [classHash, toast])

  useEffect(() => {
    if (!error) return

    toast(`Class hash not found: ${classHash}`, "error")
    setClassHashError(error as Error)
    // workaround for getting toast multiple times
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classHash, error])

  if (classHashError) {
    return <NotFound />
  }

  return (
    <div className="w-full flex-grow">
      <Breadcrumb className="mb-2">
        <BreadcrumbItem href="/">Explorer</BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem href="/">Class</BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="text-sm">
            {isMobile && classHash
              ? truncateString(classHash)
              : classHash}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </Breadcrumb>

      <PageHeader className="mb-6" title="Class" />

      {isLoading ? (
        <div className="h-40 flex items-center justify-center text-xs border border-borderGray animate-pulse">
          <span className="text-[#D0D0D0]">Loading...</span>
        </div>
      ) : (
        <div className="flex flex-col sl:flex-row sl:h-[76vh] gap-4">
          {/* Contract Info Section */}
          <div className="sl:w-[468px] min-w-[468px] flex flex-col gap-[6px] sl:overflow-y-scroll">
            <SectionBox>
              <SectionBoxEntry title="Class Hash">
                {isMobile && classHash
                  ? truncateString(classHash)
                  : classHash}
              </SectionBoxEntry>

              <SectionBoxEntry title="Compiler Version">
                v{contractVersion?.compiler}
              </SectionBoxEntry>

              <SectionBoxEntry title="Cairo Version">
                v{contractVersion?.cairo}
              </SectionBoxEntry>
            </SectionBox>
          </div>

          <div className="h-full flex-grow grid grid-rows-[min-content_1fr]">
            <DetailsPageSelector
              selected={selectedDataTab}
              onTabSelect={setSelectedDataTab}
              items={DataTabs.map((tab) => ({
                name: tab,
                value: tab,
              }))}
            />

            {(() => {
              switch (selectedDataTab) {
                case "Overview":
                  return <Overview readFuncs={readFuncs} writeFuncs={writeFuncs} code={code} />;
                case "Deploy":
                  return <Deploy classHash={classHash!} constructor={constructor} />;
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
      )}
    </div>
  );
}
