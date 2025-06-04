import { truncateString } from "@/shared/utils/string";
import { InfoIcon, PlusIcon } from "@cartridge/ui";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/breadcrumb";
import { Card, CardContent, CardLabel } from "@/shared/components/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/tabs";
import { useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import { PageHeader } from "@/shared/components/PageHeader";
import { RPC_PROVIDER } from "@/services/starknet_provider_config";
import { useQuery } from "@tanstack/react-query";
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
import { Hash } from "@/shared/components/hash";

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
  const { onTabChange } = useHashLinkTabs();

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

  if (isLoading || (!error && (!contractVersion || !code || !classHash))) {
    return <Loading />;
  }

  if (error) {
    return <NotFound />;
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="..">Explorer</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Class</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {isMobile && classHash ? truncateString(classHash) : classHash}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader title="Class" />

      <div className="flex flex-col sl:flex-row sl:h-[76vh] gap-4">
        <div className="sl:w-[468px] min-w-[468px] flex flex-col gap-[6px] sl:overflow-y-scroll">
          <Card>
            <CardContent>
              <div className="flex justify-between gap-2">
                <CardLabel>Class Hash</CardLabel>
                <Hash value={classHash} />
              </div>

              <div className="flex justify-between gap-2">
                <CardLabel>Compiler Version</CardLabel>
                <div>v{contractVersion?.compiler}</div>
              </div>

              <div className="flex justify-between gap-2">
                <CardLabel>Cairo Version</CardLabel>
                <div>v{contractVersion?.cairo}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="h-full flex-grow grid grid-rows-[min-content_1fr]">
          <Tabs defaultValue="overview" onValueChange={onTabChange}>
            <TabsList>
              <TabsTrigger value="overview">
                <InfoIcon />
                <div>Overview</div>
              </TabsTrigger>
              <TabsTrigger value="deploy">
                <PlusIcon variant="solid" />
                <div>Deploy</div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Overview
                readFuncs={readFuncs}
                writeFuncs={writeFuncs}
                code={code}
              />
            </TabsContent>

            <TabsContent value="deploy">
              <Deploy classHash={classHash!} constructor={constructor} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
