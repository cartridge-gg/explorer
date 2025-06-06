import { truncateString } from "@/shared/utils/string";
import { InfoIcon, PlusIcon, ScrollIcon, Skeleton } from "@cartridge/ui";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/breadcrumb";
import {
  Card,
  CardContent,
  CardLabel,
  CardSeparator,
} from "@/shared/components/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/tabs";
import { useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import {
  PageHeader,
  PageHeaderRight,
  PageHeaderTitle,
} from "@/shared/components/PageHeader";
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
import { Badge } from "@/shared/components/badge";

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

      <PageHeader>
        <PageHeaderTitle>
          <ScrollIcon variant="solid" />
          <div>Class</div>
        </PageHeaderTitle>

        <PageHeaderRight className="px-2 gap-2">
          {contractVersion ? (
            <>
              <Badge>Compiler v{contractVersion?.compiler}</Badge>
              <Badge>Cairo v{contractVersion?.cairo}</Badge>
            </>
          ) : (
            <>
              <Skeleton className="rounded-sm h-6 w-8" />
              <Skeleton className="rounded-sm h-6 w-8" />
            </>
          )}
        </PageHeaderRight>
      </PageHeader>

      {isLoading || (!error && (!contractVersion || !code || !classHash)) ? (
        <Loading />
      ) : error ? (
        <NotFound />
      ) : (
        <div className="flex flex-col sl:flex-row sl:h-[76vh] gap-4">
          <div className="sl:w-[468px] min-w-[468px] flex flex-col gap-[6px] sl:overflow-y-auto">
            <Card>
              <CardContent>
                <div className="flex justify-between gap-2">
                  <CardLabel>Class Hash</CardLabel>
                  <Hash value={classHash} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="h-full flex-grow grid grid-rows-[min-content_1fr]">
            <Tabs defaultValue="overview" onValueChange={onTabChange}>
              <CardContent>
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
              </CardContent>

              <CardSeparator />

              <CardContent>
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
              </CardContent>
            </Tabs>
          </Card>
        </div>
      )}
    </div>
  );
}
