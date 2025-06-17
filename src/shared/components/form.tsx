import {
  cn,
  Input,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@cartridge/ui";
import { Monaco } from "@monaco-editor/react";
import { InfoIcon } from "lucide-react";
import { editor } from "monaco-editor";
import { useCallback } from "react";
import { JsonSchema } from "json-schema-library";
import { isPrimitive } from "@/shared/utils/json-schema";
import { TypeNode } from "@/shared/utils/abi";
import { Editor } from "@/shared/components/editor";

export function ParamForm({
  params,
  onChange,
  onSubmit,
  disabled = false,
}: {
  params: {
    id?: string;
    name: string;
    description?: string;
    summary?: string;
    value: string;
    schema: JsonSchema;
    type?: TypeNode;
  }[];
  onChange: (i: number, value: string) => void;
  onSubmit?: (i: number, value: string) => void;
  disabled?: boolean;
}) {
  if (params.length === 0) return null;

  return (
    <table className="w-full overflow-x-auto max-h-[200px]">
      <tbody>
        {params.map((p, i) => (
          <tr key={i} className={"group"}>
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
              {isPrimitive(p.schema) ? (
                <Input
                  type="text"
                  className={cn(
                    "px-2 py-1 text-left w-full rounded-none group-first:rounded-t group-last:rounded-b",
                    disabled && "cursor-not-allowed",
                  )}
                  value={p.value}
                  onChange={(e) => onChange(i, e.target.value)}
                  disabled={disabled}
                  onKeyDown={(e) => {
                    switch (e.key) {
                      case "Enter":
                        onSubmit?.(i, p.value);
                        break;
                    }
                  }}
                  placeholder={p.type?.name}
                />
              ) : (
                <ParamEditor
                  id={p.id}
                  name={p.name}
                  schema={p.schema}
                  className="group-first:rounded-t group-last:rounded-b"
                  value={p.value}
                  onChange={(value) => onChange(i, value ?? "")}
                  onSubmit={(value) => onSubmit?.(i, value ?? "")}
                  readOnly={disabled}
                />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ParamEditor({
  id,
  name,
  schema,
  value,
  onChange,
  onSubmit,
  readOnly = false,
  className,
}: {
  id?: string;
  name: string;
  schema: unknown;
  value: string;
  onChange: (value?: string) => void;
  onSubmit?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}) {
  const onMount = useCallback(
    (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
      const uri = monaco.Uri.parse(`file:///${id ?? name}.json`);
      const model =
        monaco.editor.getModel(uri) ??
        monaco.editor.createModel(value, "json", uri);
      editor.setModel(model);
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [
          ...(monaco.languages.json.jsonDefaults.diagnosticsOptions?.schemas ||
            []),
          {
            uri: `schema://${name}.json`,
            fileMatch: [uri.toString()],
            schema,
          },
        ],
      });
      if (onSubmit) {
        editor.addAction({
          id: "submit",
          label: "Submit",
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
          run: () => {
            onSubmit(value);
          },
        });
      }
    },
    [id, name, value, onSubmit, schema],
  );

  return (
    <div className={cn("overflow-hidden", className)}>
      <Editor
        height={200}
        language="json"
        onMount={onMount}
        onChange={onChange}
        className={className}
        theme="cartridge-dark"
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
            alwaysConsumeMouseWheel: false,
          },
        }}
        value={value}
      />
    </div>
  );
}
