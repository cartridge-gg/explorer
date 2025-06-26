import { truncateString } from "@/shared/utils/string";
import {
  BookIcon,
  cn,
  CopyIcon,
  Input,
  ScrollIcon,
  Skeleton,
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
  CardHeader,
  CardTitle,
  CardSeparator,
  CardContent,
  CardLabel,
} from "@/shared/components/card";
import { useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import {
  PageHeader,
  PageHeaderRight,
  PageHeaderTitle,
} from "@/shared/components/PageHeader";
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
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useKeydownEffect } from "@/shared/hooks/useKeydownEffect";
import { useScrollTo } from "@/shared/hooks/useScrollTo";
import { CodeCard } from "@/shared/components/contract/Code";

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

  const { data: contractVersion } = useQuery({
    queryKey: ["contractVersion", classHash],
    queryFn: () => RPC_PROVIDER.getContractVersion(undefined, classHash!),
    enabled: !!classHash,
  });

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
    <div className="w-full flex flex-col gap-[3px] sl:w-[1135px]">
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

      <Card>
        <CardContent>
          <div className="flex justify-between gap-2">
            <CardLabel>Class Hash</CardLabel>
            <Hash value={classHash} />
          </div>
        </CardContent>
      </Card>

      {error ? (
        <NotFound />
      ) : (
        <div className="flex flex-col gap-[40px]">
          <Card className="gap-0 pb-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookIcon variant="solid" />
                <div>ABI</div>
              </CardTitle>
            </CardHeader>

            <CardSeparator className="mb-0" />

            <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-2 divide-y md:divide-y-0 md:divide-x divide-background-300">
              <CardContent className="flex flex-col justify-start gap-2 p-4">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Function name / selector / interface"
                  className="bg-input focus-visible:bg-input caret-foreground"
                />
                <div
                  ref={scrollContainerRef}
                  className="flex flex-col gap-2 overflow-y-auto max-h-[40vh]"
                >
                  <CardLabel>Functions</CardLabel>
                  <div className="flex flex-col gap-1">
                    {filtered.length ? (
                      filtered.map((f) => (
                        <div
                          key={f.name}
                          ref={(el) => setItemRef(f, el)}
                          className={cn(
                            "flex items-center justify-between gap-2 rounded-md p-2 border transition-all",
                            selected?.name === f.name
                              ? "border-primary"
                              : "border-transparent hover:border-background-300 cursor-pointer ",
                          )}
                          onClick={() => setSelected(f)}
                        >
                          <div className="truncate">{f.name}</div>
                          <Badge>{isReadFunction(f) ? "Read" : "Write"}</Badge>
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
              </CardContent>

              <div className="w-full h-full flex flex-col justify-start gap-2">
                <div className="flex flex-col gap-2 divide-y divide-background-300 h-full">
                  <div className="p-3 flex flex-col gap-2">
                    {!!selected?.interface && (
                      <div className="flex items-center justify-between gap-2">
                        <CardLabel>inteface</CardLabel>
                        <div
                          onClick={() => {
                            navigator.clipboard.writeText(
                              selected?.interface ?? "",
                            );
                            toast.success(
                              "Interface name is copied to clipboard",
                            );
                          }}
                          className="flex items-center gap-2 cursor-pointer hover:opacity-80 overflow-x-auto"
                        >
                          <div>{selected?.interface}</div>
                          <CopyIcon size="sm" className="text-foreground-400" />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <CardLabel>function</CardLabel>
                      {selected ? (
                        <div
                          onClick={() => {
                            navigator.clipboard.writeText(selected?.name ?? "");
                            toast.success(
                              "Function name is copied to clipboard",
                            );
                          }}
                          className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                        >
                          <div>{selected?.name}</div>
                          <CopyIcon size="sm" className="text-foreground-400" />
                        </div>
                      ) : (
                        <Skeleton className="rounded-sm h-6 w-40" />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <CardLabel>selector</CardLabel>
                      <Hash value={selected?.selector} />
                    </div>
                  </div>

                  <div className="h-full p-3">
                    {selected?.inputs.length ? (
                      selected?.inputs.map((input) => (
                        <div key={input.name} className="flex flex-col gap-2">
                          <CardLabel className="lowercase">
                            {input.name}
                          </CardLabel>
                          <Input
                            value={input.type.name}
                            disabled
                            className="bg-input focus-visible:bg-input"
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
          </Card>
          <CodeCard {...code} />
        </div>
      )}
    </div>
  );
}
