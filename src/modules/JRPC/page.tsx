import { Accordion, AccordionItem } from "@/shared/components/accordion";
import { BreadcrumbItem, BreadcrumbSeparator } from "@/shared/components/breadcrumbs";

import { Breadcrumb } from "@/shared/components/breadcrumbs";
import PageHeader from "@/shared/components/PageHeader";
import { BreadcrumbPage, cn } from "@cartridge/ui-next";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface OpenRPCSchema {
  methods: RPCMethod[];
  components?: {
    schemas?: Record<string, JSONSchema>;
  };
}

interface RPCMethod {
  name: string;
  summary: string;
  params: {
    name: string;
    description?: string;
    schema: JSONSchema;
  }[];
  result: {
    name: string;
    schema: JSONSchema;
  };
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

const SPEC_VERSION = "v0.8.1";

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
        <div className="flex flex-col justify-stretch border border-borderGray rounded-lg overflow-hidden py-5 px-4">
          <div className="sl:w-[468px] flex flex-col gap-[6px] sl:overflow-y-auto">
            <div className="bg-white flex gap-2 relative border border-borderGray items-center px-[15px] py-2">
              <input
                className="text-base rounded-none search-input relative focus:outline-none focus:ring-0"
                placeholder="Search"
              // value={search}
              // onChange={handleSearch}
              />
            </div>

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
                    />
                  )
                ]}
              />
            </div>
          </div>
        </div>

        <div className="h-full flex-grow grid grid-rows-[min-content_1fr]">
          <div className="flex flex-col gap-2">
            <div className="uppercase font-bold text-lg">{scheme?.methods[selected].name.replace("starknet_", "").replace(/([A-Z])/g, ' $1')}</div>
            <div>{scheme?.methods[selected].summary}</div>
          </div>
        </div>
      </div>
    </div >)
}
