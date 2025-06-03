import { rpcUrl } from "@/constants/rpc";
import { PageHeader } from "@/shared/components/PageHeader";
import { useSpecVersion } from "@/shared/hooks/useSpecVersion";
import { cn, Button, Input } from "@cartridge/ui";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/breadcrumb";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/shared/components/accordion";
import { useQuery } from "@tanstack/react-query";
import { PlayIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fromCamelCase } from "@/shared/utils/string";
import { OpenRPC, Method } from "./open-rpc";
import { ParamForm } from "@/shared/components/form";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/shared/components/card";

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
        newForm[selected.name].inputs[i].value = value;
        return prev;
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
    const res = await fetch(rpcUrl(), {
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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
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
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [methods, selected, onMethodChange, onExecute]);

  useEffect(() => {
    const method = methods.find((m) => m.name === hash.replace("#", ""));
    if (!method) return;
    onMethodChange(method);
  }, [hash, methods, onMethodChange]);

  return (
    <div id="json-playground" className="w-full flex flex-col gap-4">
      <Breadcrumb>
        <BreadcrumbList className="font-bold">
          <BreadcrumbItem>
            <BreadcrumbLink href="..">Explorer</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-bold">
              JSON-RPC Playground
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader title={`JSON-RPC Playground (${specVersion})`} />

      <div className="flex flex-col sl:flex-row sl:h-[76vh] w-full gap-4">
        <Card className="flex flex-col flex-1 md:flex-row justify-stretch border overflow-hidden py-5 px-4 gap-4">
          <div className="min-w-[250px] flex flex-col gap-[6px] sl:overflow-y-auto">
            <Input
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="max-h-[30vh] sl:max-h-none overflow-y-auto">
              <Accordion type="single" collapsible defaultValue="starknet">
                <AccordionItem value="starknet">
                  <AccordionTrigger parentClassName="[&[data-state=open]]:border-b">
                    Starknet
                  </AccordionTrigger>
                  <AccordionContent>
                    {methods?.map((method) => (
                      <div
                        className={cn(
                          "py-1 px-3",
                          method.name === selected?.name
                            ? "bg-background-200"
                            : "bg-background-100 cursor-pointer",
                        )}
                        key={method.name}
                        onClick={() => onMethodChange(method)}
                      >
                        {method.name.replace("starknet_", "")}
                      </div>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          <div className="w-full flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <div className="uppercase font-bold text-lg">
                {fromCamelCase(selected?.name?.replace("starknet_", "") ?? "")}
              </div>
              {selected?.summary && <div>{selected.summary}</div>}
            </div>

            <ParamForm
              params={
                selected?.params.map((p, i) => ({
                  ...p,
                  id: `${selected.name}-${i}`,
                  value: form[selected.name].inputs[i].value,
                })) ?? []
              }
              onChange={onParamChange}
              onSubmit={onExecute}
            />
          </div>
        </Card>

        <Card className="w-full flex-1 flex flex-col gap-2 py-5 px-4 lg:max-w-[800px]">
          <Button
            onClick={onExecute}
            variant="secondary"
            className="self-end w-40"
            isLoading={form[selected?.name ?? ""]?.loading}
          >
            Execute
            <PlayIcon className="size-2 fill-white" />
          </Button>

          <div className="w-full overflow-auto">
            <Accordion type="multiple" defaultValue={["request", "response"]}>
              <AccordionItem value="request">
                <AccordionTrigger parentClassName="[&[data-state=open]>div]:text-foreground-200 [&[data-state=open]]:border-b">
                  Request
                </AccordionTrigger>
                <AccordionContent className="min-h-80 overflow-x-auto p-3">
                  <code>
                    <pre>{requestJSON}</pre>
                  </code>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="response">
                <AccordionTrigger parentClassName="[&[data-state=open]>div]:text-foreground-200 [&[data-state=open]]:border-b">
                  Response
                </AccordionTrigger>
                <AccordionContent className="min-h-80 overflow-x-auto p-3">
                  <code>
                    <pre>{responseJSON}</pre>
                  </code>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </Card>
      </div>
    </div>
  );
}
