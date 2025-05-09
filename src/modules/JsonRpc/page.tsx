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
import { OpenRPC, Method } from "./open-rpc";
import { ParamEditor } from "./Editor";

interface FormState {
  inputs: { name: string, value: string }[];
  result: unknown;
  hasCalled: boolean;
  loading: boolean;
}

export function JsonRpcPlayground() {
  const { data: specVersion } = useSpecVersion();
  const { data: rpc } = useQuery({
    queryKey: ["starknet", "rpc", specVersion],
    queryFn: async () => {
      const rpc = await OpenRPC.fromUrl(`https://raw.githubusercontent.com/starkware-libs/starknet-specs/v${specVersion}/api/starknet_api_openrpc.json`)
      return rpc
    },
    enabled: !!specVersion,
  });

  const [search, setSearch] = useState("");
  const methods = useMemo(() => {
    const methods = rpc?.getMethodList();
    if (!methods) return [];
    if (!search) return methods;

    return methods.filter(m =>
      m.name.toLowerCase().includes(search.toLowerCase()) ??
      m.description?.toLowerCase().includes(search.toLowerCase()) ??
      m.summary?.toLowerCase().includes(search.toLowerCase())
    );
  }, [rpc, search]);

  const [id, setId] = useState(0);
  const [selected, setSelected] = useState<Method | undefined>(() => methods?.[0]);
  const [form, setForm] = useState<Record<string, FormState>>({});

  const requestJSON = useMemo(() => {
    if (!selected || !form[selected.name]) return
    const { inputs } = form[selected.name]

    return JSON.stringify({
      jsonrpc: "2.0",
      method: selected.name,
      params: inputs?.map(p => {
        if (typeof p.value === "undefined") {
          return ""
        }

        try {
          return JSON.parse(p.value)
        } catch {
          return p.value
        }
      }),
    }, null, 2)
  }, [selected, form])

  const responseJSON = useMemo(() => {
    if (!selected || !form[selected.name]) return ""

    const { result } = form[selected.name]
    if (!result) return ""
    return JSON.stringify(result, null, 2)
  }, [selected, form])

  const onMethodChange = useCallback((method: Method) => {
    setSelected(method)
    setForm(prev => ({
      ...prev,
      [method.name]: prev[method.name] ?? {
        inputs: method.params?.map(p => ({ name: p.name, value: "" })),
        result: null,
        hasCalled: false,
        loading: false,
      }
    }))
  }, [])

  const onParamChange = useCallback((i: number, value?: string) => {
    if (!selected) return;

    setForm(prev => ({
      ...prev,
      [selected.name]: {
        ...prev[selected.name],
        inputs: prev[selected.name].inputs.map(
          (p, ii) => ii === i
            ? { ...p, value: value ?? "" }
            : p
        ),
      }
    }))
  }, [selected]);

  const onExecute = useCallback(async () => {
    if (!selected) return;

    setForm(prev => ({
      ...prev,
      [selected.name]: {
        ...prev[selected.name],
        loading: true,
      }
    }))
    const f = form[selected.name]
    const params = f.inputs.map(p => {
      try {
        return JSON.parse(p.value)
      } catch {
        return p.value
      }
    })
    const res = await fetch(rpcUrl(), {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id,
        method: selected.name,
        params
      }),
    })
    const json = await res.json();
    setId(id => id + 1)
    setForm(prev => ({
      ...prev,
      [selected.name]: {
        ...prev[selected.name],
        result: json,
        hasCalled: true,
        loading: false,
      }
    }))
  }, [id, selected, form]);

  useEffect(() => {
    if (!methods.length) return;
    setSelected(methods[0])
    setForm(prev => ({
      ...prev,
      [methods[0].name]: {
        ...prev[methods[0].name],
        inputs: methods[0].params?.map(p => ({ name: p.name, value: "" })),
      }
    }))
  }, [methods])

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
                    {methods?.map((method) => (
                      <div
                        className={cn(
                          "py-1 px-3",
                          method.name === selected?.name
                            ? "bg-[#DBDBDB]"
                            : "bg-[#F3F3F3] cursor-pointer",
                        )}
                        key={method.name}
                        onClick={() => onMethodChange(method)}
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
                {fromCamelCase(selected?.name?.replace("starknet_", "") ?? "")}
              </div>
              <div>
                {
                  methods?.find((m) => m.name === selected?.name)?.summary
                }
              </div>
            </div>

            {!!selected?.params?.length && (
              <table className="bg-white overflow-x-auto max-h-[200px]">
                <tbody>
                  {selected.params.map((p, i) => (
                    <tr
                      key={i}
                      className={i === selected.params.length - 1 ? "border-b" : ""}
                    >
                      <td className="px-2 py-1 text-left align-top w-[90px] italic">
                        <div className="flex items-center gap-2">
                          <span>{p.name}</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger >
                                <InfoIcon className="size-3" />
                              </TooltipTrigger>
                              <TooltipContent
                                side="right"
                                className="bg-[#F3F3F3] p-2 max-w-[300px]"
                              >
                                <div>{p.description ?? p.summary}</div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </td>

                      <td className="text-left align-top p-0">
                        {OpenRPC.isPrimitive(p) ? (
                          <input
                            type="text"
                            className="px-2 py-1 text-left w-full"
                            value={form[selected.name].inputs[i].value}
                            onChange={(e) => onParamChange(i, e.target.value)}
                          />
                        ) : (
                          <ParamEditor
                            name={`${selected.name}_${p.name}`}
                            schema={p.schema}
                            value={form[selected.name].inputs[i].value}
                            onChange={(value) => onParamChange(i, value)}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
              <div className="overflow-x-auto">
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
              <div className="min-h-80 overflow-x-auto">
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
