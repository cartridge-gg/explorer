import { useState } from "react";
import { Editor } from "@monaco-editor/react";
import DetailsPageSelector from "@/shared/components/DetailsPageSelector";
import { useWorld } from "./hooks";

const DataTabs = ["Schema", "Models", "Model", "Transactions", "Events"];

export function World() {
  const [selectedDataTab, setSelectedDataTab] = useState(DataTabs[0]);
  const { form, setForm, schema, models, model } = useWorld();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div>World</div>
        <div>
          Project:{" "}
          <input
            className="border border-gray-300 rounded-md p-2"
            value={form.project}
            onChange={(e) =>
              setForm({ ...form, project: e.target.value, model: undefined })
            }
          />
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
            case "Schema":
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
              if (!model || !models) return null;
              return (
                <div className="flex flex-col gap-4">
                  <select
                    className="border border-gray-300 rounded-md p-2"
                    value={form.model}
                    onChange={(e) =>
                      setForm({ ...form, model: e.target.value })
                    }
                  >
                    {models.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.namespace} - {m.name}
                      </option>
                    ))}
                  </select>

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
