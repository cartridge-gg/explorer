import { truncateString } from "@/shared/utils/string";
import {
  BookIcon,
  cn,
  CopyIcon,
  Input,
  ScrollIcon,
  Skeleton,
  PulseIcon,
  SearchIcon,
} from "@cartridge/ui";
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
  CardSeparator,
  CardContent,
  CardLabel,
} from "@/shared/components/card";
import { useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import { PageHeader, PageHeaderTitle } from "@/shared/components/PageHeader";
import { RPC_PROVIDER } from "@/services/rpc";
import { useQuery } from "@tanstack/react-query";
import {
  getContractClassInfo,
  ContractClassInfo,
  isValidAddress,
} from "@/shared/utils/contract";
import { NotFound } from "@/modules/NotFound/page";
import { Hash } from "@/shared/components/hash";
import { Badge } from "@/shared/components/badge";
import { FunctionAbiWithAst, isReadFunction } from "@/shared/utils/abi";
import { memo, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useKeydownEffect } from "@/shared/hooks/useKeydownEffect";
import { useScrollTo } from "@/shared/hooks/useScrollTo";
import { Editor } from "@/shared/components/editor";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/tabs";

const initialData: ContractClassInfo = {
  constructor: {
    inputs: [],
    name: "constructor",
    outputs: [],
    type: "constructor",
    selector: "",
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

  const {
    data: { readFuncs, writeFuncs, code },
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

  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      [...readFuncs, ...writeFuncs].filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.inputs.some((a) =>
            a.name.toLowerCase().includes(search.toLowerCase()),
          ) ||
          f.interface?.toLowerCase().includes(search.toLowerCase()) ||
          f.selector.toLowerCase().includes(search.toLowerCase()),
      ),
    [readFuncs, writeFuncs, search],
  );
  const [selected, setSelected] = useState<FunctionAbiWithAst>(
    () => filtered[0],
  );

  // Scroll to selected function hook
  const { scrollContainerRef, setItemRef } = useScrollTo({
    item: selected,
    getItemKey: (method: FunctionAbiWithAst) => method.name,
  });

  useEffect(() => {
    if (selected) return;
    setSelected(filtered[0]);
  }, [selected, filtered]);

  useKeydownEffect((e) => {
    if (!filtered.length) return;

    const currentIndex = filtered.findIndex((m) => m.name === selected?.name);
    if (currentIndex === -1) return;

    switch (e.key) {
      case "ArrowDown":
      case "j": {
        e.preventDefault();
        const newIndex = Math.min(filtered.length - 1, currentIndex + 1);
        setSelected(filtered[newIndex]);
        break;
      }
      case "ArrowUp":
      case "k": {
        e.preventDefault();
        const newIndex = Math.max(0, currentIndex - 1);
        setSelected(filtered[newIndex]);
        break;
      }
    }
  });

  return (
    <div className="w-full flex flex-col gap-[3px] sl:w-[1134px]">
      <Breadcrumb className="mb-[7px]">
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

      <PageHeader
        containerClassName="px-[15px] py-[8px] rounded-b-sm"
        className="px-0"
      >
        <PageHeaderTitle className="gap-[12px]">
          <ScrollIcon variant="solid" />
          <p className="text-[14px]/[20px] font-medium">Class</p>
        </PageHeaderTitle>
      </PageHeader>

      <Card className="p-[15px] rounded-t-sm rounded-b-[12px] h-[72px]">
        <CardContent className="gap-[6px] px-0">
          <CardLabel className="text-[12px]/[16px] font-normal">Hash</CardLabel>
          <Hash value={classHash} containerClassName="w-fit" className="px-0" />
        </CardContent>
      </Card>

      {error ? (
        <NotFound />
      ) : (
        <div className="flex flex-col pt-[40px] mb-[40px]">
          <Card className="h-full flex-grow grid grid-rows-[min-content_1fr] overflow-x-scroll rounded-[12px] py-0 pt-[3px] gap-0">
            <Tabs defaultValue="abi" className="h-full">
              <CardContent className="px-[15px] py-[3px]">
                <TabsList className="gap-[12px] p-0">
                  <TabsTrigger
                    value="abi"
                    className="data-[state=active]:shadow-none gap-[4px] p-[8px]"
                  >
                    <BookIcon variant="solid" />
                    <p className="text-[13px]/[20px] font-normal">ABI</p>
                  </TabsTrigger>
                  <TabsTrigger
                    value="code"
                    className="data-[state=active]:shadow-none gap-[4px] p-[8px]"
                  >
                    <PulseIcon variant="solid" />
                    <p className="text-[13px]/[20px] font-normal">Code</p>
                  </TabsTrigger>
                </TabsList>
              </CardContent>

              <Separator />

              <CardContent className="h-[640px] px-0">
                <TabsContent value="abi" className="mt-0 h-full">
                  <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] divide-y md:divide-y-0 md:divide-x divide-background-300 h-full">
                    <div className="flex flex-col justify-start gap-[15px] p-[15px] h-full">
                      <div className="relative">
                        <Input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Function name / selector / interface"
                          className="bg-input focus-visible:bg-input caret-foreground placeholder:text-[#262A27] px-[10px] py-[7px] focus-visible:border-background-400"
                        />
                        <SearchIcon
                          className={cn(
                            "absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none",
                            search ? "text-foreground" : "text-foreground-400",
                          )}
                        />
                      </div>
                      <div
                        ref={scrollContainerRef}
                        className="flex flex-col gap-2 overflow-y-auto flex-1"
                      >
                        <CardLabel>Functions</CardLabel>
                        <div className="flex flex-col gap-1">
                          {filtered.length ? (
                            filtered.map((f) => (
                              <div
                                key={f.name}
                                ref={(el) => setItemRef(f, el)}
                                className={cn(
                                  "flex items-center justify-between gap-2 rounded-md px-[8px] border transition-all h-[35px]",
                                  selected?.name === f.name
                                    ? "border-primary"
                                    : "border-transparent hover:border-background-300 cursor-pointer ",
                                )}
                                onClick={() => setSelected(f)}
                              >
                                <p className="text-[13px]/[16px] font-semibold tracking-[0.26px] truncate">
                                  {f.name}
                                </p>
                                <Badge className="px-[8px] py-[2px]">
                                  <span className="text-[12px]/[16px] font-medium">
                                    {isReadFunction(f) ? "Read" : "Write"}
                                  </span>
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <>
                              {Array.from({ length: 9 }).map((_, i) => (
                                <Skeleton
                                  key={i}
                                  className="rounded-sm h-11 w-full"
                                />
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-full flex flex-col justify-start gap-2">
                      <div className="flex flex-col divide-y divide-background-300 h-full">
                        <div className="py-[10px] px-[15px] flex flex-col gap-[10px]">
                          {!!selected?.interface && (
                            <div className="flex items-center justify-between gap-2">
                              <CardLabel className="text-[13px]/[16px] font-normal">
                                interface
                              </CardLabel>
                              <div
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    selected?.interface ?? "",
                                  );
                                  toast.success(
                                    "Interface name is copied to clipboard",
                                  );
                                }}
                                className="flex items-center gap-2 cursor-pointer overflow-x-auto group"
                              >
                                <p className="text-[13px]/[16px] font-semibold text-foreground group-hover:text-foreground-200">
                                  {selected?.interface}
                                </p>
                                <CopyIcon
                                  size="sm"
                                  className="text-foreground-400"
                                />
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <CardLabel className="text-[13px]/[16px] font-normal">
                              function
                            </CardLabel>
                            {selected ? (
                              <div
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    selected?.name ?? "",
                                  );
                                  toast.success(
                                    "Function name is copied to clipboard",
                                  );
                                }}
                                className="flex items-center gap-2 cursor-pointer overflow-x-auto group"
                              >
                                <p className="text-[13px]/[16px] font-semibold text-foreground group-hover:text-foreground-200">
                                  {selected?.name}
                                </p>
                                <CopyIcon
                                  size="sm"
                                  className="text-foreground-400"
                                />
                              </div>
                            ) : (
                              <Skeleton className="rounded-sm h-6 w-40" />
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <CardLabel className="text-[13px]/[16px] font-normal">
                              selector
                            </CardLabel>
                            <Hash value={selected?.selector} />
                          </div>
                        </div>

                        <div className="flex-1 p-[15px] space-y-[10px]">
                          {selected?.inputs.length ? (
                            selected?.inputs.map((input) => (
                              <div
                                key={input.name}
                                className="flex flex-col gap-[6px]"
                              >
                                <CardLabel className="lowercase">
                                  {input.name}
                                </CardLabel>
                                <Input
                                  value={input.type.name}
                                  disabled
                                  className="bg-input focus-visible:bg-input border-none disabled:bg-input px-[10px] py-[7px]"
                                />
                              </div>
                            ))
                          ) : (
                            <div className="h-full flex items-center justify-center text-foreground-300">
                              No inputs
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="code" className="mt-0">
                  <Editor
                    className="min-h-[80vh] p-[15px]"
                    defaultLanguage="json"
                    value={code.abi}
                    options={{
                      readOnly: true,
                      scrollbar: {
                        alwaysConsumeMouseWheel: false,
                      },
                    }}
                  />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      )}
    </div>
  );
}

const Separator = memo(({ className }: { className?: string }) => (
  <CardSeparator
    className={cn("my-0 left-[-15px] w-[calc(100%+30px)]", className)}
  />
));
