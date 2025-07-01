import { getRpcUrl } from "@/services/rpc";
import { PageHeader, PageHeaderTitle } from "@/shared/components/PageHeader";
import { useSpecVersion } from "@/shared/hooks/useSpecVersion";
import {
  cn,
  Button,
  Input,
  TerminalIcon,
  SearchIcon,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  CardContent,
  CardHeader,
  CardLabel,
  CardTitle,
} from "@/shared/components/card";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatSnakeCaseToDisplayValue,
  fromCamelCase,
} from "@/shared/utils/string";
import { OpenRPC, Method } from "./open-rpc";
import { useLocation, useNavigate } from "react-router-dom";
import { useKeydownEffect } from "@/shared/hooks/useKeydownEffect";
import { useScrollTo } from "@/shared/hooks/useScrollTo";

interface FormState {
  inputs: { name: string; value: string }[];
  result: unknown;
  hasCalled: boolean;
  loading: boolean;
}

export function JsonRpcPlayground() {
  const { data: specVersion } = useSpecVersion();
  const { data: rpc } = useQuery({
    queryKey: ["starknet", "rpc", specVersion],
    queryFn: () =>
      OpenRPC.fromUrl(
        `https://raw.githubusercontent.com/starkware-libs/starknet-specs/v${specVersion}/api/starknet_api_openrpc.json`,
      ),
    enabled: !!specVersion,
  });

  const { hash } = useLocation();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const methods = useMemo(() => {
    const methods = rpc?.getMethodList();
    if (!methods) return [];
    if (!search) return methods;

    return methods.filter(
      (m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ??
        m.description?.toLowerCase().includes(search.toLowerCase()) ??
        m.summary?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [rpc, search]);

  const [id, setId] = useState(0);
  const [selected, setSelected] = useState<Method | undefined>(
    () =>
      methods?.find((m) => m.name === hash.replace("#", "")) ?? methods?.[0],
  );
  const [form, setForm] = useState<Record<string, FormState>>({});

  // Scroll to selected method hook
  const { scrollContainerRef, setItemRef } = useScrollTo({
    item: selected,
    getItemKey: (method: Method) => method.name,
  });

  const onMethodChange = useCallback(
    (method: Method) => {
      setSelected(method);
      setForm((prev) => ({
        ...prev,
        [method.name]: prev[method.name] ?? {
          inputs: method.params?.map((p) => ({ name: p.name, value: "" })),
          result: null,
          hasCalled: false,
          loading: false,
        },
      }));
      navigate(`#${method.name}`);
    },
    [navigate],
  );

  const onParamChange = useCallback(
    (i: number, value?: string) => {
      if (!selected || typeof value === "undefined") return;
      setForm((prev) => {
        const newForm = { ...prev };
        if (!newForm[selected.name]) {
          newForm[selected.name] = {
            inputs:
              selected.params?.map((p) => ({ name: p.name, value: "" })) || [],
            result: null,
            hasCalled: false,
            loading: false,
          };
        }
        newForm[selected.name].inputs[i].value = value;
        return newForm;
      });
    },
    [selected],
  );

  const requestJSON = useMemo(() => {
    if (!selected || !form[selected.name]) return;
    const { inputs } = form[selected.name];

    return JSON.stringify(
      {
        jsonrpc: "2.0",
        method: selected.name,
        params: inputs?.map((p) => {
          if (typeof p.value === "undefined") {
            return "";
          }

          try {
            return JSON.parse(p.value);
          } catch {
            return p.value;
          }
        }),
      },
      null,
      2,
    );
  }, [selected, form]);

  const responseJSON = useMemo(() => {
    if (!selected || !form[selected.name]) return "";

    const { result } = form[selected.name];
    if (!result) return "";
    return JSON.stringify(result, null, 2);
  }, [selected, form]);

  const parametersSection = useMemo(() => {
    if (!selected?.params || selected.params.length === 0) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[15px]">
        {selected.params.map((param, i) => (
          <div key={i} className="flex flex-col gap-[8px]">
            <CardLabel className="text-[12px]/[16px] font-semibold tracking-[0.24px] text-foreground-400">
              {formatSnakeCaseToDisplayValue(param.name)}
            </CardLabel>
            <div className="relative flex items-center w-full">
              <Input
                placeholder={param.name}
                value={form[selected?.name]?.inputs[i]?.value || ""}
                onChange={(e) => onParamChange(i, e.target.value)}
                containerClassName="w-full"
                className="bg-input focus-visible:bg-input border-none caret-foreground font-sans px-[10px] py-[5px] h-[30px] rounded-sm"
              />
            </div>
          </div>
        ))}
      </div>
    );
  }, [selected, form, onParamChange]);

  const onExecute = useCallback(async () => {
    if (!selected) return;

    setForm((prev) => ({
      ...prev,
      [selected.name]: {
        ...prev[selected.name],
        loading: true,
      },
    }));
    const f = form[selected.name];
    const params = f.inputs.map((p) => {
      try {
        return JSON.parse(p.value);
      } catch {
        return p.value;
      }
    });
    const res = await fetch(getRpcUrl(), {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id,
        method: selected.name,
        params,
      }),
    });
    const json = await res.json();
    setId((id) => id + 1);
    setForm((prev) => ({
      ...prev,
      [selected.name]: {
        ...prev[selected.name],
        result: json,
        hasCalled: true,
        loading: false,
      },
    }));
  }, [id, selected, form]);

  useEffect(() => {
    if (!methods.length) return;
    setSelected(methods[0]);
    setForm((prev) => ({
      ...prev,
      [methods[0].name]: {
        ...prev[methods[0].name],
        inputs: methods[0].params?.map((p) => ({ name: p.name, value: "" })),
      },
    }));
  }, [methods]);

  useKeydownEffect((e) => {
    if (!methods.length) return;

    const currentIndex = methods.findIndex((m) => m.name === selected?.name);
    if (currentIndex === -1) return;

    switch (e.key) {
      case "ArrowDown":
      case "j": {
        e.preventDefault();
        const newIndex = Math.min(methods.length - 1, currentIndex + 1);
        onMethodChange(methods[newIndex]);
        break;
      }
      case "ArrowUp":
      case "k": {
        e.preventDefault();
        const newIndex = Math.max(0, currentIndex - 1);
        onMethodChange(methods[newIndex]);
        break;
      }
      case "Enter": {
        if (!e.metaKey && !e.ctrlKey) return;
        e.preventDefault();
        onExecute();
        break;
      }
    }
  });

  useEffect(() => {
    const method = methods.find((m) => m.name === hash.replace("#", ""));
    if (!method) return;
    onMethodChange(method);
  }, [hash, methods, onMethodChange]);

  return (
    <div
      id="json-playground"
      className="w-full max-w-full flex flex-col gap-[3px] sl:w-[1134px]"
    >
      <Breadcrumb className="mb-[7px]">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="..">Explorer</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-foreground-400 text-[12px]/[16px] font-normal">
              Playground
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        containerClassName="rounded-t-[12px] rounded-b-[4px]"
        className="px-[15px] py-[8px]"
      >
        <PageHeaderTitle className="gap-[12px]">
          <TerminalIcon variant="solid" />
          <h1 className="text-[14px]/[20px] font-medium">
            JSON-RPC Playground
          </h1>
        </PageHeaderTitle>
      </PageHeader>

      <div className="flex flex-col gap-2">
        <Card className="py-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-background-200 min-w-0">
          {/* Methods Section */}
          <div className="md:w-[300px] flex flex-col gap-3 py-3">
            <CardContent>
              <div className="relative flex items-center w-full">
                <Input
                  placeholder="Method"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  containerClassName="w-full"
                  className="bg-input focus-visible:bg-input focus-visible:border-foreground-300 pr-10 caret-foreground"
                />
                <SearchIcon className="absolute right-3" />
              </div>
            </CardContent>

            <CardHeader>
              <CardTitle>Methods</CardTitle>
            </CardHeader>

            <>
              {/* Mobile Select */}
              <CardContent className="md:hidden">
                <Select
                  value={selected?.name || ""}
                  onValueChange={(value) => {
                    const method = methods.find((m) => m.name === value);
                    if (method) onMethodChange(method);
                  }}
                >
                  <SelectTrigger className="w-full h-full">
                    <SelectValue placeholder="Select a method..." />
                  </SelectTrigger>
                  <SelectContent>
                    {methods?.map((method) => (
                      <SelectItem key={method.name} value={method.name}>
                        <div className="flex flex-col gap-1 items-start">
                          <div className="text-foreground-400 text-xs font-medium">
                            {method.name.split("_")[0]}
                          </div>
                          <div className="text-sm text-foreground-200">
                            {method.name.replace("starknet_", "")}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>

              {/* Desktop List */}
              <CardContent
                ref={scrollContainerRef}
                className="hidden md:block overflow-y-auto max-h-[20vh] md:max-h-full"
              >
                {methods?.length > 0 ? (
                  methods.map((method) => (
                    <div
                      ref={(el) => setItemRef(method, el)}
                      className={cn(
                        "py-2 px-4 cursor-pointer flex flex-col gap-1 transition-colors rounded border border-transparent",
                        method.name === selected?.name
                          ? "border-primary"
                          : "hover:border-background-400",
                      )}
                      key={method.name}
                      onClick={() => onMethodChange(method)}
                    >
                      <div className="text-foreground-400 text-xs font-medium">
                        {method.name.split("_")[0]}
                      </div>
                      {method.summary && (
                        <div className="text-sm text-foreground-200 text-medium">
                          {method.name.replace("starknet_", "")}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-4 px-4 text-center text-foreground-300">
                    No method found
                  </div>
                )}
              </CardContent>
            </>
          </div>

          {/* Parameters and Request/Response Section */}
          <div className="w-full flex flex-col py-3">
            <div className="flex flex-col gap-4 divide-y divide-background-200">
              <CardContent className="flex flex-col gap-2">
                <div className="flex flex-col gap-2">
                  <CardLabel>Method</CardLabel>
                  <div>
                    {fromCamelCase(
                      selected?.name?.replace("starknet_", "") ?? "",
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <CardLabel>Description</CardLabel>
                  {selected?.summary && <div>{selected.summary}</div>}
                </div>
              </CardContent>

              <div className="flex flex-col gap-4">
                <CardContent className="py-3">
                  {/* New custom parameters implementation */}
                  {parametersSection}
                </CardContent>

                <CardContent className="py-3">
                  <Button
                    onClick={onExecute}
                    variant="primary"
                    className="self-end bg-foreground-100 px-[10px] h-[25px] rounded-sm"
                    isLoading={form[selected?.name ?? ""]?.loading}
                  >
                    <span className="text-[13px]/[16px] font-semibold uppercase">
                      Send
                    </span>
                  </Button>
                </CardContent>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-background-200">
              {/* Request Section */}
              <CardContent className="flex flex-col gap-2">
                <CardLabel>Request</CardLabel>
                <div className="p-3 bg-input rounded">
                  <code className="text-sm block">
                    <pre className="whitespace-pre-wrap">{requestJSON}</pre>
                  </code>
                </div>
              </CardContent>

              {/* Response Section */}
              <CardContent className="flex flex-col gap-2">
                <CardLabel>Response</CardLabel>
                <div className="p-3 bg-input rounded min-h-40">
                  <code className="text-sm block">
                    <pre className="whitespace-pre-wrap">{responseJSON}</pre>
                  </code>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
