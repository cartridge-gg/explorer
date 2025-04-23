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
import { useState } from "react";

const DataTabs = ["Overview", "Deploy"];

export default function ClassHashDetails() {
  const { classHash } = useParams();
  const { isMobile } = useScreen();
  const [selectedDataTab, setSelectedDataTab] = useState(DataTabs[0]);

  const { data: contractVersion } = useQuery({
    queryKey: ["contractVersion", classHash],
    queryFn: () => RPC_PROVIDER.getContractVersion(undefined, classHash!),
    enabled: !!classHash,
  });

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

          <div className="bg-white flex flex-col gap-3 mt-[6px] px-[15px] py-[17px] border border-borderGray overflow-auto">
            <div className="w-full h-full overflow-auto">
              {(() => {
                switch (selectedDataTab) {
                  case "Overview":
                    return <div>Overview</div>;
                  case "Deploy":
                    return <div>Deploy</div>;
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
