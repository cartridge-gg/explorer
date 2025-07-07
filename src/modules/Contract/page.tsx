import { useParams } from "react-router-dom";
import { useScreen } from "@/shared/hooks/useScreen";
import { truncateString } from "@/shared/utils/string";
import { RPC_PROVIDER } from "@/services/rpc";
import { Contract as StarknetContract } from "starknet";
import {
  BookIcon,
  cn,
  Input,
  Skeleton,
  SearchIcon,
  Button,
  PlusIcon,
  ListIcon,
} from "@cartridge/ui";
import { PageHeader, PageHeaderTitle } from "@/shared/components/PageHeader";
import { useBalances } from "@/shared/hooks/useBalances";
import {
  getContractClassInfo,
  ContractClassInfo,
  isValidAddress,
} from "@/shared/utils/contract";
import { useQuery } from "@tanstack/react-query";
import { useHashLinkTabs } from "@/shared/hooks/useHashLinkTabs";
import { Loading } from "@/shared/components/Loading";
import { NotFound } from "../NotFound/page";
import {
  Card,
  CardContent,
  CardHeader,
  CardLabel,
  CardSeparator,
  CardTitle,
} from "@/shared/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/breadcrumb";
import { Hash } from "@/shared/components/hash";
import { Badge } from "@/shared/components/badge";
import {
  FunctionAbiWithAst,
  isReadFunction,
  toCalldata,
} from "@/shared/utils/abi";
import { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { useKeydownEffect } from "@/shared/hooks/useKeydownEffect";
import { useScrollTo } from "@/shared/hooks/useScrollTo";
import { CopyIcon } from "@cartridge/ui";
import { MultiFilter } from "@/shared/components/filter";
import { useAccount } from "@starknet-react/core";
import { useCallCartDispatch } from "@/store/ShoppingCartProvider";
import { ParamForm } from "@/shared/components/form";

interface FunctionWithType extends FunctionAbiWithAst {
  functionType: "read" | "write";
}

const initialData: Omit<ContractClassInfo, "constructor"> & {
  classHash?: string;
  contract?: StarknetContract;
  nonce?: string;
} = {
  classHash: undefined,
  contract: undefined,
  readFuncs: [],
  writeFuncs: [],
  code: {
    abi: "",
    sierra: undefined,
  },
  nonce: undefined,
};

export function Contract() {
  const { contractAddress } = useParams<{
    contractAddress: string;
  }>();
  const { isMobile } = useScreen();
  const tab = useHashLinkTabs("interact");

  const {
    data: { classHash, contract, readFuncs, writeFuncs, nonce },
    isLoading,
    error,
  } = useQuery({
    queryKey: ["contractClass", contractAddress],
    queryFn: async () => {
      if (!contractAddress || !isValidAddress(contractAddress)) {
        throw new Error("Invalid contract address");
      }

      const [classHash, contractClass, nonce] = await Promise.all([
        RPC_PROVIDER.getClassHashAt(contractAddress),
        RPC_PROVIDER.getClassAt(contractAddress),
        RPC_PROVIDER.getNonceForAddress(contractAddress),
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
        nonce,
      };
    },
    initialData,
    retry: false,
  });

  const { balances, isStrkLoading, isEthLoading } = useBalances(
    contractAddress ?? "",
  );

  const [search, setSearch] = useState("");
  const [functionTypeFilter, setFunctionTypeFilter] = useState<string[]>([]);
  const [form, setForm] = useState<{
    [key: string]: {
      inputs: { value: string }[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result?: any;
      error?: Error | string;
      hasCalled: boolean;
      loading: boolean;
    };
  }>({});

  const allFunctions = useMemo((): FunctionWithType[] => {
    const functions = [
      ...readFuncs.map((f) => ({ ...f, functionType: "read" as const })),
      ...writeFuncs.map((f) => ({ ...f, functionType: "write" as const })),
    ];
    return functions;
  }, [readFuncs, writeFuncs]);

  const filtered = useMemo(() => {
    let functions = allFunctions;

    // Apply function type filter
    if (functionTypeFilter.length > 0) {
      functions = functions.filter((f) =>
        functionTypeFilter.includes(f.functionType),
      );
    }

    // Apply search filter
    return functions.filter(
      (f) =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.inputs.some((a) =>
          a.name.toLowerCase().includes(search.toLowerCase()),
        ) ||
        f.interface?.toLowerCase().includes(search.toLowerCase()) ||
        f.selector.toLowerCase().includes(search.toLowerCase()),
    );
  }, [allFunctions, search, functionTypeFilter]);
  const [selected, setSelected] = useState<FunctionWithType | undefined>(
    () => filtered[0],
  );

  // Scroll to selected function hook
  const { scrollContainerRef, setItemRef } = useScrollTo({
    item: selected,
    getItemKey: (method: FunctionWithType) => method.name,
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

  const { account } = useAccount();
  const { addCall } = useCallCartDispatch();

  const onUpdate = useCallback(
    (name: string, value: Partial<(typeof form)[string]>) => {
      setForm((prev) => ({
        ...prev,
        [name]: {
          ...(prev[name] || { inputs: [], hasCalled: false, loading: false }),
          ...value,
        },
      }));
    },
    [],
  );

  const onCallOrExecute = useCallback(
    async (f: FunctionWithType) => {
      if (!contract || (!isReadFunction(f) && !account)) {
        onUpdate(f.name, {
          error: "Please connect your wallet first",
          result: undefined,
          hasCalled: true,
        });
        return;
      }

      onUpdate(f.name, { loading: true });

      try {
        const currentForm = form[f.name] || { inputs: [] };
        const calldata = currentForm.inputs.flatMap((input, idx) => {
          let value;
          try {
            value = JSON.parse(input.value);
          } catch {
            value = input.value;
          }
          return toCalldata(f.inputs[idx].type, value);
        });

        if (isReadFunction(f)) {
          const result = await contract.call(f.name, calldata, {
            parseRequest: false,
            parseResponse: false,
          });
          onUpdate(f.name, { result: result, error: undefined });
        } else {
          const result = await account!.execute([
            {
              calldata: calldata,
              entrypoint: f.name,
              contractAddress: contract.address,
            },
          ]);
          onUpdate(f.name, { result: result, error: undefined });
        }
      } catch (error) {
        console.error("failed to call contract", error);
        onUpdate(f.name, { error: error as Error, result: undefined });
      } finally {
        onUpdate(f.name, { hasCalled: true, loading: false });
      }
    },
    [contract, account, form, onUpdate],
  );

  const onAddToCart = useCallback(
    (f: FunctionWithType) => {
      if (!contract || isReadFunction(f) || !account) {
        return;
      }

      const currentForm = form[f.name] || { inputs: [] };
      const calldata = currentForm.inputs.flatMap((input, idx) => {
        let value;
        try {
          value = JSON.parse(input.value);
        } catch {
          value = input.value;
        }
        return toCalldata(f.inputs[idx].type, value);
      });

      addCall({
        calldata: calldata,
        entrypoint: f.name,
        contractAddress: contract.address,
      });
      toast.success(`Function call added: ${f.name}`);
    },
    [contract, form, addCall, account],
  );

  const onChange = useCallback(
    (f: FunctionWithType, inputIndex: number, value: string) => {
      const currentForm = form[f.name] || { inputs: [] };
      const newInputs = [...currentForm.inputs];
      newInputs[inputIndex] = {
        ...(newInputs[inputIndex] || {}),
        value,
      };
      onUpdate(f.name, { inputs: newInputs });
    },
    [form, onUpdate],
  );

  const onCopyClassHash = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!classHash) {
        return;
      }

      navigator.clipboard.writeText(classHash);
      toast.success("Address copied to clipboard");
    },
    [classHash],
  );

  return (
    <div className="w-full flex flex-col gap-[3px] sl:w-[1134px]">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="..">Explorer</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Contracts</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-foreground-400 text-[12px]/[16px] font-normal">
              {isMobile && contractAddress
                ? truncateString(contractAddress)
                : contractAddress}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        containerClassName="px-[15px] py-[8px] rounded-t-[12px] rounded-b-sm"
        className="p-0"
      >
        <PageHeaderTitle className="gap-[12px]">
          <ListIcon variant="solid" />
          <h1 className="text-[14px]/[20px] font-medium">Contract</h1>
        </PageHeaderTitle>
      </PageHeader>

      {isLoading || (!error && (!classHash || !contract)) ? (
        <Loading />
      ) : error ? (
        <NotFound />
      ) : (
        <div className="flex flex-col gap-[20px] sm:gap-[40px] sl:w-[1134px]">
          {/* Contract Info Section */}
          <div className="flex flex-col gap-[3px]">
            {/* Address Card */}
            <Card className="p-0 rounded-sm">
              <CardContent className="flex flex-col md:flex-row p-0 gap-0 divide-y md:divide-x divide-background-200 ">
                <div className="flex-1 flex flex-col md:flex-row items-start md:items-center gap-[8px] md:gap-[40px] p-[15px]">
                  <div className="flex flex-row items-center md:items-start justify-between md:flex-col gap-[6px] w-full">
                    <CardLabel className="text-[12px]/[16px] tracking-[0.24px]">
                      Address
                    </CardLabel>
                    <Hash
                      className="px-0"
                      value={contractAddress}
                      length={isMobile ? 4 : 12}
                    />
                  </div>

                  <div className="flex flex-row items-center md:items-start justify-between md:flex-col gap-[6px] w-full">
                    <CardLabel className="text-[12px]/[16px] tracking-[0.24px]">
                      Nonce
                    </CardLabel>
                    <p className="text-foreground-100 text-[13px] font-semibold">
                      {Number(nonce)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-[6px] p-[15px]">
                  <CardLabel className="text-[12px]/[16px] tracking-[0.24px]">
                    Class Hash
                  </CardLabel>
                  <div
                    className="bg-background-200 hover:bg-[#2B2F2C] rounded-sm py-[4px] px-[10px] border border-[#454B46] cursor-pointer"
                    onClick={onCopyClassHash}
                  >
                    <Hash value={classHash} length={12} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Balances Card */}
            <Card className="p-[15px] rounded-t-sm rounded-b-[12px]">
              <CardHeader className="p-0">
                <CardTitle className="text-[12px] p-0">Balances</CardTitle>
              </CardHeader>

              <CardContent className="flex flex-row gap-[1px] p-0">
                <div className="bg-background-200 hover:bg-background-300 flex flex-col justify-between p-[12px] h-[64px] min-w-[150px] md:w-[150px] w-full">
                  <CardLabel className="text-[12px]/[16px] tracking-[0.24px]">
                    Starknet Token
                  </CardLabel>
                  <p className="text-[13px]/[16px] tracking-[0.26px] font-mono text-foreground-100">
                    {isStrkLoading
                      ? "0.00"
                      : balances.strk !== undefined
                        ? (Number(balances.strk) / 10 ** 18).toString()
                        : "N/A"}
                  </p>
                </div>
                <div className="bg-background-200 hover:bg-background-300 flex flex-col justify-between p-[12px] h-[64px] min-w-[150px] md:w-[150px] w-full">
                  <CardLabel className="text-[12px]/[16px] tracking-[0.24px]">
                    Ether
                  </CardLabel>
                  <p className="text-[13px]/[16px] tracking-[0.26px] font-mono text-foreground-100">
                    {isEthLoading
                      ? "0.00"
                      : balances.eth !== undefined
                        ? (Number(balances.eth) / 10 ** 18).toString()
                        : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="max-h-[640px] flex-grow grid grid-rows-[min-content_1fr] rounded-[12px] p-0 mb-[20px] gap-0">
            <CardContent className="max-h-[640px] p-0 pt-[5px] gap-0">
              {isMobile ? (
                <div className="h-full max-h-[640px] overflow-y-auto p-0">
                  <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] divide-y md:divide-y-0 md:divide-x divide-background-300 h-full">
                    {/* sidebar */}
                    <div className="flex flex-col justify-start gap-[15px] p-[15px] h-full overflow-y-auto">
                      <MultiFilter
                        placeholder="Mutability"
                        value={functionTypeFilter}
                        onValueChange={(values) => {
                          setFunctionTypeFilter(values);
                        }}
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
                      <div
                        ref={scrollContainerRef}
                        className="flex flex-col min-h-0 gap-[8px]"
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
                                    {f.functionType === "read"
                                      ? "Read"
                                      : "Write"}
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

                    <div className="w-full h-full flex flex-col overflow-y-scroll divide-y divide-background-300">
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

                      <div className="flex flex-col gap-[10px] h-[400px] md:h-full justify-between p-[15px]">
                        {selected?.inputs.length ? (
                          <>
                            <ParamForm
                              params={selected.inputs.map((input, i) => ({
                                ...input,
                                id: `${selected.name}-${input.name}`,
                                value:
                                  form[selected.name]?.inputs[i]?.value ??
                                  (input.type.type === "struct"
                                    ? "{\n\t\n}"
                                    : input.type.type === "array"
                                      ? "[\n\t\n]"
                                      : ""),
                              }))}
                              onChange={(i, value) =>
                                onChange(selected, i, value)
                              }
                              disabled={
                                !contract ||
                                (!isReadFunction(selected) && !account)
                              }
                            />

                            <div className="flex flex-col gap-[10px]">
                              {!!contract &&
                                selected &&
                                (isReadFunction(selected) ? (
                                  <Button
                                    variant="secondary"
                                    isLoading={form[selected.name]?.loading}
                                    onClick={() => onCallOrExecute(selected)}
                                  >
                                    call
                                  </Button>
                                ) : (
                                  <div className="flex items-center justify-between w-full">
                                    <Button
                                      variant="secondary"
                                      onClick={() => onAddToCart(selected)}
                                      disabled={!account}
                                      className="h-[30px] gap-[7px] px-[10px] py-[6px] normal-case font-sans bg-background-200 border border-[#454B46]"
                                    >
                                      <PlusIcon
                                        variant="solid"
                                        className="!w-[19px] !h-[19px]"
                                      />
                                      <span className="text-[13px]/[16px] font-semibold">
                                        Add to queue
                                      </span>
                                    </Button>

                                    <Button
                                      variant="primary"
                                      className="h-[30px] px-[10px] py-[6px] bg-foreground-100 text-background-100"
                                      disabled={
                                        !account || form[selected.name]?.loading
                                      }
                                      onClick={() => onCallOrExecute(selected)}
                                    >
                                      <span className="text-[13px]/[16px] font-semibold uppercase">
                                        {form[selected.name]?.loading
                                          ? "Executing..."
                                          : "Execute"}
                                      </span>
                                    </Button>
                                  </div>
                                ))}

                              {selected && form[selected.name]?.hasCalled && (
                                <div className="w-full flex flex-col gap-1">
                                  <p className="font-bold text-sm uppercase">
                                    Result
                                  </p>
                                  <div className="bg-white">
                                    {form[selected.name]?.loading ? (
                                      <div className="text-gray-600">
                                        Loading...
                                      </div>
                                    ) : form[selected.name]?.error ? (
                                      <div className="text-red-500 p-3 bg-red-50 border border-red-200">
                                        <p className="font-medium">Error:</p>
                                        <p className="text-sm">
                                          {form[
                                            selected.name
                                          ]?.error?.toString()}
                                        </p>
                                      </div>
                                    ) : form[selected.name]?.result ? (
                                      <div className="px-3 py-2 border border-borderGray">
                                        <pre className="text-sm overflow-x-auto">
                                          {JSON.stringify(
                                            form[selected.name]?.result,
                                            null,
                                            2,
                                          )}
                                        </pre>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="h-full flex items-center justify-center text-foreground-300">
                            No inputs
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Tabs value={tab.selected} onValueChange={tab.onChange}>
                  <TabsList>
                    <TabsTrigger value="interact">
                      <BookIcon variant="solid" />
                      <p>Interact</p>
                    </TabsTrigger>
                  </TabsList>
                  <CardSeparator className="my-0 relative left-[-15px] w-[calc(100%+30px)]" />

                  <div className="h-full max-h-[640px] overflow-y-auto p-0">
                    <TabsContent
                      value="interact"
                      className="h-full data-[state=active]:mt-0"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] divide-y md:divide-y-0 md:divide-x divide-background-300 h-full">
                        {/* sidebar */}
                        <div className="flex flex-col justify-start gap-[15px] p-[15px] h-full overflow-y-auto">
                          <MultiFilter
                            placeholder="Mutability"
                            value={functionTypeFilter}
                            onValueChange={(values) => {
                              setFunctionTypeFilter(values);
                            }}
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
                                search
                                  ? "text-foreground"
                                  : "text-foreground-400",
                              )}
                            />
                          </div>
                          <div
                            ref={scrollContainerRef}
                            className="flex flex-col min-h-0 gap-[8px]"
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
                                        {f.functionType === "read"
                                          ? "Read"
                                          : "Write"}
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

                        <div className="w-full h-full flex flex-col overflow-y-scroll divide-y divide-background-300">
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

                          <div className="flex flex-col h-full justify-between p-[15px]">
                            {selected?.inputs.length ? (
                              <>
                                <ParamForm
                                  params={selected.inputs.map((input, i) => ({
                                    ...input,
                                    id: `${selected.name}-${input.name}`,
                                    value:
                                      form[selected.name]?.inputs[i]?.value ??
                                      (input.type.type === "struct"
                                        ? "{\n\t\n}"
                                        : input.type.type === "array"
                                          ? "[\n\t\n]"
                                          : ""),
                                  }))}
                                  onChange={(i, value) =>
                                    onChange(selected, i, value)
                                  }
                                  disabled={
                                    !contract ||
                                    (!isReadFunction(selected) && !account)
                                  }
                                />

                                <div className="flex flex-col gap-[10px]">
                                  {!!contract &&
                                    selected &&
                                    (isReadFunction(selected) ? (
                                      <Button
                                        variant="secondary"
                                        isLoading={form[selected.name]?.loading}
                                        onClick={() =>
                                          onCallOrExecute(selected)
                                        }
                                      >
                                        call
                                      </Button>
                                    ) : (
                                      <div className="flex items-center justify-between w-full">
                                        <Button
                                          variant="secondary"
                                          onClick={() => onAddToCart(selected)}
                                          disabled={!account}
                                          className="h-[30px] gap-[7px] px-[10px] py-[6px] normal-case font-sans bg-background-200 border border-[#454B46]"
                                        >
                                          <PlusIcon
                                            variant="solid"
                                            className="!w-[19px] !h-[19px]"
                                          />
                                          <span className="text-[13px]/[16px] font-semibold">
                                            Add to queue
                                          </span>
                                        </Button>

                                        <Button
                                          variant="primary"
                                          className="h-[30px] px-[10px] py-[6px] bg-foreground-100 text-background-100"
                                          disabled={
                                            !account ||
                                            form[selected.name]?.loading
                                          }
                                          onClick={() =>
                                            onCallOrExecute(selected)
                                          }
                                        >
                                          <span className="text-[13px]/[16px] font-semibold uppercase">
                                            {form[selected.name]?.loading
                                              ? "Executing..."
                                              : "Execute"}
                                          </span>
                                        </Button>
                                      </div>
                                    ))}

                                  {selected &&
                                    form[selected.name]?.hasCalled && (
                                      <div className="w-full flex flex-col gap-1">
                                        <p className="font-bold text-sm uppercase">
                                          Result
                                        </p>
                                        <div className="bg-white">
                                          {form[selected.name]?.loading ? (
                                            <div className="text-gray-600">
                                              Loading...
                                            </div>
                                          ) : form[selected.name]?.error ? (
                                            <div className="text-red-500 p-3 bg-red-50 border border-red-200">
                                              <p className="font-medium">
                                                Error:
                                              </p>
                                              <p className="text-sm">
                                                {form[
                                                  selected.name
                                                ]?.error?.toString()}
                                              </p>
                                            </div>
                                          ) : form[selected.name]?.result ? (
                                            <div className="px-3 py-2 border border-borderGray">
                                              <pre className="text-sm overflow-x-auto">
                                                {JSON.stringify(
                                                  form[selected.name]?.result,
                                                  null,
                                                  2,
                                                )}
                                              </pre>
                                            </div>
                                          ) : null}
                                        </div>
                                      </div>
                                    )}
                                </div>
                              </>
                            ) : (
                              <div className="h-full flex items-center justify-center text-foreground-300">
                                No inputs
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
