import { truncateString } from "@/shared/utils/string";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbSeparator,
} from "@/shared/components/breadcrumbs";
import { BreadcrumbPage } from "@cartridge/ui";
import { useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import PageHeader from "@/shared/components/PageHeader";
import { SectionBoxEntry } from "@/shared/components/section";
import { SectionBox } from "@/shared/components/section/SectionBox";
import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { useQuery } from "@tanstack/react-query";
import DetailsPageSelector from "@/shared/components/DetailsPageSelector";
import { Overview } from "./Overview";
import { Deploy } from "./Deploy";
import {
  getContractClassInfo,
  ContractClassInfo,
  isValidAddress,
} from "@/shared/utils/contract";
import { NotFound } from "@/modules/NotFound/page";
import { useHashLinkTabs } from "@/shared/hooks/useHashLinkTabs";
import { Loading } from "@/shared/components/Loading";

const initialData: ContractClassInfo = {
  constructor: {
    inputs: [],
    name: "constructor",
    outputs: [],
    type: "constructor",
  },
  readFuncs: [],
  writeFuncs: [],
  code: {
    abi: "",
    sierra: undefined,
  },
};

export function ClassHash() {
  const { classHash } = useParams();
  const { isMobile } = useScreen();
  const { selected, onTabChange, tabs } = useHashLinkTabs([
    "Overview",
    "Deploy",
  ]);

  const { data: contractVersion } = useQuery({
    queryKey: ["contractVersion", classHash],
    queryFn: () => RPC_PROVIDER.getContractVersion(undefined, classHash!),
    enabled: !!classHash,
  });

  const {
    data: { constructor, readFuncs, writeFuncs, code },
    isLoading,
    error,
  } = useQuery({
    queryKey: ["contractClass", classHash],
    queryFn: async () => {
      if (!classHash || !isValidAddress(classHash)) {
        throw new Error("Invalid class hash");
      }

      const contractClass = await RPC_PROVIDER.getClassByHash(classHash!);
      return contractClass ? getContractClassInfo(contractClass) : initialData;
    },
    initialData,
    retry: false,
  });

  if (isLoading || (!error && (!contractVersion || !code))) {
    return <Loading />;
  }

  if (error) {
    return <NotFound />;
  }

  return (
    <div id="class-details" className="w-full flex-grow">
      <Breadcrumb className="mb-2">
        <BreadcrumbItem to="..">Explorer</BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>Class</BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="text-sm">
            {isMobile && classHash ? truncateString(classHash) : classHash}
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
                {isMobile && classHash ? truncateString(classHash) : classHash}
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
              selected={selected}
              onTabSelect={onTabChange}
              items={tabs}
            />

            {(() => {
              switch (selected) {
                case "Overview":
                  return (
                    <Overview
                      readFuncs={readFuncs}
                      writeFuncs={writeFuncs}
                      code={code}
                    />
                  );
                case "Deploy":
                  return (
                    <Deploy classHash={classHash!} constructor={constructor} />
                  );
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
      )}
    </div>
  );
}
