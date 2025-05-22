import { useState } from "react";
import { Editor } from "@monaco-editor/react";
import DetailsPageSelector from "@/shared/components/DetailsPageSelector";
import { useWorld } from "./hooks";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
  cn,
} from "@cartridge/ui-next";

const DataTabs = ["GraphQL Schema", "Models", "Model", "Transactions", "Events"];

export function World() {
  const [selectedDataTab, setSelectedDataTab] = useState(DataTabs[0]);
  const { form, setForm, deployments, schema, models, model } = useWorld();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div>World</div>
        <div className="flex items-center gap-2">
          Project:{" "}
          {deployments ? (
            <Select
              onValueChange={(value) =>
                setForm((form) => ({
                  ...form,
                  project: value,
                  model: undefined,
                }))
              }
              value={form.project}
            >
              <SelectTrigger className="bg-white border border-gray-300 rounded-md p-2 w-60">
                <SelectValue placeholder="project-name" />
              </SelectTrigger>
              <SelectContent className="bg-white w-60 border border-gray-300 rounded-md mt-1 max-h-[300px]">
                {deployments.map((d) => (
                  <SelectItem
                    key={d}
                    value={d}
                    className="cursor-pointer p-2 hover:bg-gray-100"
                    simplified
                  >
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <input
              className="border border-gray-300 rounded-md p-2"
              value={form.project}
              onChange={(e) =>
                setForm((form) => ({
                  ...form,
                  project: e.target.value,
                  model: undefined,
                }))
              }
            />
          )}
        </div>
      </div>

      <div className="h-full flex-grow grid grid-rows-[min-content_1fr] gap-4">
        <DetailsPageSelector
          selected={selectedDataTab}
          onTabSelect={setSelectedDataTab}
          items={DataTabs.map((tab) => ({
            name: tab,
            value: tab,
          }))}
        />

        {(() => {
          switch (selectedDataTab) {
            case "GraphQL Schema":
              return (
                <Editor
                  height="80vh"
                  defaultLanguage="json"
                  value={JSON.stringify(schema, null, 2)}
                  options={{
                    readOnly: true,
                  }}
                />
              );
            case "Models":
              if (!models?.length) {
                return (
                  <div className="w-full h-[80vh] flex items-center justify-center text-sm text-gray-500">
                    no models
                  </div>
                )
              }
              return (
                <Editor
                  height="80vh"
                  defaultLanguage="json"
                  value={JSON.stringify(models, null, 2)}
                  options={{
                    readOnly: true,
                  }}
                />
              );
            case "Model":
              if (!models?.length) {
                return (
                  <div className="w-full h-[80vh] flex items-center justify-center text-sm text-gray-500">
                    no model found
                  </div>
                )
              }
              return (
                <div className="flex flex-col gap-4">
                  <Select
                    onValueChange={(value) =>
                      setForm((form) => ({ ...form, model: value }))
                    }
                    value={form.model}
                  >
                    <SelectTrigger className="bg-white border border-gray-300 rounded-md p-2 w-60 overflow-x-auto">
                      <SelectValue placeholder="model name" />
                    </SelectTrigger>
                    <SelectContent className="bg-white w-60 border border-gray-300 rounded-md mt-1">
                      {models.map((m) => (
                        <SelectItem
                          key={m.name}
                          value={m.name}
                          className={cn(
                            "cursor-pointer p-2 hover:bg-gray-100",
                            // disabled prefix doesn't work for some reason
                            form.model === m.name
                              ? "opacity-50 cursor-not-allowed hover:bg-white"
                              : undefined,
                          )}
                          simplified
                          disabled={form.model === m.name}
                        >
                          {m.namespace} - {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Editor
                    height="80vh"
                    defaultLanguage="json"
                    value={JSON.stringify(model, null, 2)}
                    options={{
                      readOnly: true,
                    }}
                  />
                </div>
              );
            default:
              return (
                <div className="h-full p-2 flex items-center justify-center min-h-[150px] text-xs lowercase">
                  <span className="text-[#D0D0D0]">Coming soon</span>
                </div>
              );
          }
        })()}
      </div>
    </div>
  );
}
