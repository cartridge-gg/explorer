import { rpcUrl } from "@/constants/rpc";
import { Accordion, AccordionItem } from "@/shared/components/accordion";
import { BreadcrumbItem, BreadcrumbSeparator } from "@/shared/components/breadcrumbs";

import { Breadcrumb } from "@/shared/components/breadcrumbs";
import PageHeader from "@/shared/components/PageHeader";
import { useSpecVersion } from "@/shared/hooks/useSpecVersion";
import { BreadcrumbPage, cn, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@cartridge/ui-next";
import { useQuery } from "@tanstack/react-query";
import { InfoIcon, PlayIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fromCamelCase } from "@/shared/utils/string";
interface OpenRPCSchema {
  methods: JRPCMethod[];
  components?: {
    schemas?: Record<string, JSONSchema>;
  };
}

interface JRPCMethod {
  name: string;
  summary: string;
  params?: JRPCParam[];
  result: {
    name: string;
    schema: JSONSchema;
  };
}

interface JRPCParam {
  name: string;
  description?: string;
  schema: JSONSchema;
  value: string;
}

interface JSONSchema {
  type?: string;
  $ref?: string;
  items?: JSONSchema;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  enum?: string[];
  description?: string;
}

interface JRPCRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Pick<JRPCParam, "name" | "value">[];
}

interface JRPCResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
  };
}

export default function JRPCPlayground() {
  const { data: specVersion } = useSpecVersion();
  const { data: scheme } = useQuery({
    queryKey: ["starknet", "scheme"],
    queryFn: async () => {
      const response = await fetch(`https://raw.githubusercontent.com/starkware-libs/starknet-specs/v${specVersion}/api/starknet_api_openrpc.json`);
      const data = await response.json() as OpenRPCSchema;
      return data;
    },
  });
  const [search, setSearch] = useState("");
  const [request, setRequest] = useState<JRPCRequest>({
    id: 0,
    jsonrpc: "2.0",
    method: "starknet_specVersion",
  });
  const [response, setResponse] = useState<JRPCResponse>();
  const requestJSON = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...json } = request
    return JSON.stringify(json, null, 2)
  }, [request])

  const responseJSON = useMemo(() => {
    if (!response) return ""
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...json } = response
    return JSON.stringify(json, null, 2)
  }, [response])

  useEffect(() => {
    setRequest(req => ({
      id: req.id === 0 ? 0 : req.id + 1,
      jsonrpc: "2.0",
      method: scheme?.methods[0].name ?? "",
    }))
  }, [scheme])

  const onMethodChange = useCallback((selected: JRPCMethod) => () => {
    setRequest(req => ({
      id: req.id === 0 ? 0 : req.id + 1,
      jsonrpc: "2.0",
      method: selected.name,
      params: scheme?.methods.find(m => m.name === selected.name)?.params?.map((p) => ({ name: p.name, value: "" })) ?? []
    }))
  }, [scheme])

  const onParamChange = useCallback((name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setRequest(req => ({
      ...req,
      params: req.params?.map(p => p.name === name ? ({ ...p, value: e.target.value }) : p)
    }))
  }, [])

  const onExecute = useCallback(async () => {
    const res = await fetch(rpcUrl(), {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(request),
    })
    const json = await res.json();
    setResponse(json)
  }, [request]);

  const methods = useMemo(() => {
    if (!scheme?.methods) return [];
    if (!search) return scheme.methods;

    return scheme.methods.filter(method =>
      method.name.toLowerCase().includes(search.toLowerCase()) ??
      method.summary.toLowerCase().includes(search.toLowerCase())
    );
  }, [scheme?.methods, search]);

  return (
    <div id="json-playground" className="w-full flex-grow gap-8">
      <div className="mb-2">
        <Breadcrumb>
          <BreadcrumbItem href="/">Explorer</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem href="/">
            <BreadcrumbPage className="text-sm">
              JSON-RPC Playground
            </BreadcrumbPage>
          </BreadcrumbItem>
        </Breadcrumb>
      </div>

      <PageHeader
        className="mb-6"
        title={`JSON-RPC Playground (${specVersion})`}
      />

      <div className="flex flex-col sl:flex-row sl:h-[76vh] gap-4">
        <div className="flex flex-col md:flex-row justify-stretch border border-borderGray overflow-hidden py-5 px-4 gap-4 bg-white">
          <div className="min-w-[320px] flex flex-col gap-[6px] sl:overflow-y-auto">
            <input
              className="bg-white border border-borderGray px-4 py-2 text-base rounded-none search-input relative focus:outline-none focus:ring-0"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="max-h-[30vh] sl:max-h-none overflow-y-auto">
              <Accordion>
                <AccordionItem
                  open
                  key="starknet"
                  title="Starknet"
                  titleClassName="uppercase font-bold"
                  contentClassName="p-0 overflow-y-scroll"
                >
                  <div>
                    {methods.map((method) => (
                      <div
                        className={cn(
                          "py-1 px-3",
                          method.name === request.method
                            ? "bg-[#DBDBDB]"
                            : "bg-[#F3F3F3] cursor-pointer",
                        )}
                        key={method.name}
                        onClick={onMethodChange(method)}
                      >
                        {method.name.replace("starknet_", "")}
                      </div>
                    ))}
                  </div>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          <div className="h-full flex-grow grid grid-rows-[min-content_1fr] gap-8 w-80">
            <div className="flex flex-col gap-2">
              <div className="uppercase font-bold text-lg">
                {fromCamelCase(request.method.replace("starknet_", ""))}
              </div>
              <div>
                {
                  scheme?.methods.find((m) => m.name === request.method)
                    ?.summary
                }
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {scheme?.methods
                .find((m) => m.name === request.method)
                ?.params?.map((param) => (
                  <div key={param.name} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="uppercase">{param.name}</div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="size-4 flex items-center justify-center">
                            <InfoIcon className="size-3" />
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="bg-[#F3F3F3] p-2 max-w-[300px]"
                          >
                            <div>{param.description}</div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <input
                      className="bg-white border border-borderGray px-3 py-1 text-base rounded-none search-input relative focus:outline-none focus:ring-0"
                      value={
                        request.params?.find((p) => p.name === param.name)
                          ?.value ?? ""
                      }
                      onChange={onParamChange(param.name)}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-grow gap-2 border border-borderGray overflow-hidden py-5 px-4 bg-white">
          <button
            onClick={onExecute}
            className="bg-black text-white px-2 py-1 text-sm self-end flex items-center gap-3 uppercase font-bold hover:bg-opacity-80"
          >
            Execute
            <PlayIcon className="size-2 fill-white" />
          </button>
          <Accordion>
            <AccordionItem
              key="request"
              title="request"
              titleClassName="uppercase"
              open
            >
              <div>
                <code>
                  <pre>{requestJSON}</pre>
                </code>
              </div>
            </AccordionItem>
            <AccordionItem
              key="response"
              title="response"
              titleClassName="uppercase"
              open
            >
              <div className="min-h-80">
                <code>
                  <pre>{responseJSON}</pre>
                </code>
              </div>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
