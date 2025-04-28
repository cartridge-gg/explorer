import { RPC_URL } from "@/constants/rpc";
import { Accordion, AccordionItem } from "@/shared/components/accordion";
import { BreadcrumbItem, BreadcrumbSeparator } from "@/shared/components/breadcrumbs";

import { Breadcrumb } from "@/shared/components/breadcrumbs";
import PageHeader from "@/shared/components/PageHeader";
import { BreadcrumbPage, cn, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@cartridge/ui-next";
import { useQuery } from "@tanstack/react-query";
import { InfoIcon, PlayIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  params?: JRPCParam[];
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
  const { data: scheme } = useQuery({
    queryKey: ["scheme"],
    queryFn: async () => {
      const response = await fetch(`https://raw.githubusercontent.com/starkware-libs/starknet-specs/${SPEC_VERSION}/api/starknet_api_openrpc.json`);
      const data = await response.json() as OpenRPCSchema;
      return data;
    },
  });
  const [selected, setSelected] = useState(0);
  const [search, setSearch] = useState("");
  const [request, setRequest] = useState<JRPCRequest>({
    id: 0,
    jsonrpc: "2.0",
    method: scheme?.methods[selected].name ?? "",
  });
  const [response, setResponse] = useState<JRPCResponse>();

  useEffect(() => {
    setRequest(req => ({
      id: req.id === 0 ? 0 : req.id + 1,
      jsonrpc: "2.0",
      method: scheme?.methods[selected].name ?? "",
    }))
  }, [scheme, selected])

  const onExecute = useCallback(async () => {
    const res = await fetch(RPC_URL, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(request),
    })
    const json = await res.json();
    setResponse(json)
  }, [request]);

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

  return (
    <div className="w-full flex-grow gap-8">
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

      <PageHeader className="mb-6" title="JSON-RPC Playground" />

      <div className="flex flex-col sl:flex-row sl:h-[76vh] gap-4">
        <div className="flex flex-col md:flex-row justify-stretch border border-borderGray rounded-lg overflow-hidden py-5 px-4 gap-4">
          <div className="min-w-[320px] flex flex-col gap-[6px] sl:overflow-y-auto">
            <input
              className="bg-white border border-borderGray px-4 py-2 text-base rounded-none search-input relative focus:outline-none focus:ring-0"
              placeholder="Search"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <div
              className="max-h-[30vh] sl:max-h-none overflow-y-auto">
              <Accordion
                items={() => [
                  (
                    <AccordionItem
                      key="starknet"
                      title="Starknet"
                      titleClassName="uppercase font-bold"
                      content={(
                        <div>
                          {scheme?.methods.map((method, i) => (
                            <div
                              className={cn("py-2 px-4", selected === i ? "bg-[#DBDBDB]" : "bg-[#F3F3F3] cursor-pointer")}
                              key={method.name}
                              onClick={() => setSelected(i)}
                            >
                              {method.name.replace("starknet_", "")}
                            </div>
                          ))}
                        </div>
                      )}
                      contentClassName="p-0 overflow-y-scroll"
                      open
                    />
                  )
                ]}
              />
            </div>
          </div>

          <div className="h-full flex-grow grid grid-rows-[min-content_1fr] gap-8 w-80">
            <div className="flex flex-col gap-2">
              <div className="uppercase font-bold text-lg">{scheme?.methods[selected].name.replace("starknet_", "").replace(/([A-Z])/g, ' $1')}</div>
              <div>{scheme?.methods[selected].summary}</div>
            </div>

            <div className="flex flex-col gap-2">
              {scheme?.methods[selected].params?.map((param) => (
                <div key={param.name} className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="uppercase">{param.name}</div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="size-4 flex items-center justify-center">
                          <InfoIcon className="size-3" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-[#F3F3F3] p-2 max-w-[300px]">
                          <div>{param.description}</div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <input className="bg-white border border-borderGray px-3 py-1 text-base rounded-none search-input relative focus:outline-none focus:ring-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-grow gap-2 border border-borderGray rounded-lg overflow-hidden py-5 px-4">
          <button
            className="bg-black text-white px-4 py-2 rounded-md self-end flex items-center gap-2 uppercase font-bold"
            onClick={onExecute}
          >
            Execute
            <PlayIcon className="size-3 fill-white" />
          </button>
          <Accordion
            items={() => [
              <AccordionItem
                title="request"
                content={(
                  <div>
                    <code>
                      <pre>
                        {requestJSON}
                      </pre>
                    </code>
                  </div>
                )}
                open
              />,
              <AccordionItem
                title="response"
                content={(
                  <div className="min-h-80">
                    <code>
                      <pre>
                        {responseJSON}
                      </pre>
                    </code>
                  </div>
                )}
                open
              />
            ]}
          />
        </div>
      </div>
    </div>
  )
}
