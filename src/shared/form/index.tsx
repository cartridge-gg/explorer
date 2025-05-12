import { OpenRPC } from "@/modules/JsonRpc/open-rpc";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@cartridge/ui-next";
import { Editor, Monaco } from "@monaco-editor/react"
import { InfoIcon } from "lucide-react";
import { editor } from "monaco-editor";
import { useCallback } from "react"

export function ParamForm({
  params,
  onChange,
  disabled = false,
}: {
  params: {
    name: string,
    description?: string,
    summary?: string,
    value: string,
    schema: { type: string }
    placeholder?: string
  }[]
  onChange: (i: number, value: string) => void
  disabled?: boolean
}) {
  if (params.length === 0) return null

  return (
    <table className="w-full bg-white overflow-x-auto max-h-[200px]">
      <tbody>
        {params.map((p, i) => (
          <tr
            key={i}
            className={i === params.length - 1 ? "border-b" : ""}
          >
            <td className="px-2 py-1 text-left align-top w-[90px] italic">
              <div className="flex items-center gap-2">
                <span>{p.name}</span>
                {(p.description || p.summary) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
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
                )}
              </div>
            </td>

            <td className="text-left align-top p-0">
              {OpenRPC.isPrimitive(p.schema) ? (
                <input
                  type="text"
                  className="px-2 py-1 text-left w-full"
                  value={p.value}
                  onChange={(e) => onChange(i, e.target.value)}
                  disabled={disabled}
                  placeholder={p.placeholder}
                />
              ) : (
                <ParamEditor
                  name={`${name}_${p.name}`}
                  schema={p.schema}
                  value={p.value}
                  onChange={(value) => onChange(i, value ?? "")}
                  readOnly={disabled}
                />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ParamEditor({
  name,
  schema,
  value,
  onChange,
  readOnly = false,
}: {
  name: string,
  schema: unknown,
  value: string,
  onChange: (value?: string) => void
  readOnly?: boolean;
}) {
  const onMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    const uri = monaco.Uri.parse(`file:///${name}.json`)
    const model = monaco.editor.getModel(uri) ?? monaco.editor.createModel(value, "json", uri);

    editor.setModel(model);
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [
        ...(monaco.languages.json.jsonDefaults.diagnosticsOptions
          ?.schemas || []),
        {
          uri: `schema://${name}.json`,
          fileMatch: [uri.toString()],
          schema,
        },
      ],
    })
  }, [name, schema, value])

  return (
    <Editor
      height={200}
      language="json"
      onMount={onMount}
      onChange={onChange}
      options={{
        readOnly,
        lineNumbers: "off",
        cursorStyle: "line",
        automaticLayout: true,
        roundedSelection: false,
        selectOnLineNumbers: true,
        snippetSuggestions: "inline",
        suggestOnTriggerCharacters: true,
        scrollbar: {
          arrowSize: 10,
          useShadows: false,
          vertical: "visible",
          horizontal: "visible",
          verticalHasArrows: true,
          horizontalHasArrows: true,
          verticalScrollbarSize: 17,
          horizontalScrollbarSize: 17,
          alwaysConsumeMouseWheel: false
        },
      }}
      value={value}
    />

  )
}
