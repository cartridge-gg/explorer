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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/shared/components/tabs";
import { Editor } from "@/shared/components/editor";
import { MultiFilter } from "@/shared/components/filter";

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
  const [functionTypeFilter, setFunctionTypeFilter] = useState<string[]>([]);
  const filtered = useMemo(() => {
    let functions = [
      ...readFuncs.map((f) => ({ ...f, functionType: "read" as const })),
      ...writeFuncs.map((f) => ({ ...f, functionType: "write" as const })),
    ];
    if (functionTypeFilter.length > 0) {
      functions = functions.filter((f) =>
        functionTypeFilter.includes(f.functionType),
      );
    }
    return functions.filter(
      (f) =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.inputs.some((a) =>
          a.name.toLowerCase().includes(search.toLowerCase()),
        ) ||
        f.interface?.toLowerCase().includes(search.toLowerCase()) ||
        f.selector.toLowerCase().includes(search.toLowerCase()),
    );
  }, [readFuncs, writeFuncs, search, functionTypeFilter]);
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
            <BreadcrumbPage className="text-foreground-400 text-[12px]/[16px] font-normal">
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

      <div className="flex flex-col gap-[20px] md:gap-[40px]">
        <Card className="p-[15px] rounded-t-sm rounded-b-[12px] h-[72px]">
          <CardContent className="gap-[6px] px-0">
            <CardLabel className="text-[12px]/[16px] font-normal">
              Hash
            </CardLabel>
            <Hash
              length={3}
              value={classHash}
              containerClassName="w-fit"
              className="px-0"
            />
          </CardContent>
        </Card>

        {error ? (
          <NotFound />
        ) : (
          <Card className="relative h-[640px] flex-grow grid grid-rows-[min-content_1fr] rounded-[12px] p-0 mb-[20px] gap-0">
            <Tabs defaultValue="abi" className="h-full">
              <CardContent className="px-[15px] pt-[3px] h-[43px] gap-0 pb-0">
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

              <CardContent className="h-[597px] p-0 gap-0 relative">
                <TabsContent
                  value="abi"
                  className="data-[state=inactive]:hidden mt-0 grid grid-cols-1 md:grid-cols-[340px_1fr] divide-y md:divide-y-0 md:divide-x divide-background-200 h-full"
                >
                  {/* Left: Function List */}
                  <div className="flex flex-col justify-start h-full overflow-y-auto">
                    <div className="sticky top-0 bg-background space-y-[15px] p-[15px]">
                      <MultiFilter
                        placeholder="Mutability"
                        value={functionTypeFilter}
                        onValueChange={setFunctionTypeFilter}
                        items={[
                          { key: "read", value: "Read" },
                          { key: "write", value: "Write" },
                        ]}
                      />
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
                      <CardLabel>Functions</CardLabel>
                    </div>
                    <div
                      ref={scrollContainerRef}
                      className="flex flex-col gap-[3px] p-[15px] pt-0 select-none"
                    >
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

                  {/* Right: Function Details */}
                  <div className="w-full h-full flex flex-col divide-y divide-background-200">
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
                        <Hash
                          length={isMobile ? 1 : 3}
                          value={selected?.selector}
                        />
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
                </TabsContent>

                <TabsContent
                  value="code"
                  className="data-[state=inactive]:hidden mt-0"
                >
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
        )}
      </div>
    </div>
  );
}

const Separator = memo(({ className }: { className?: string }) => (
  <span>
    <CardSeparator className={cn("my-0", className)} />
  </span>
));
