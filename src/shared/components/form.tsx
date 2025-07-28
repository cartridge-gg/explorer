import {
  cn,
  Input,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@cartridge/ui";
import { Monaco } from "@monaco-editor/react";
import { InfoIcon } from "lucide-react";
import { editor } from "monaco-editor";
import { useCallback } from "react";
import { JsonSchema } from "json-schema-library";
import { isPrimitive } from "@/shared/utils/json-schema";
import { TypeNode } from "@/shared/utils/abi";
import { Editor } from "@/shared/components/editor";
import { formatSnakeCaseToDisplayValue } from "../utils/string";

export function ParamForm({
  params,
  onChange,
  onSubmit,
  disabled = false,
  className,
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
  className?: string;
}) {
  if (params.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-[10px] w-full", className)}>
      {params.map((p, i) => (
        <div key={i} className="flex flex-col gap-[10px]">
          <div className="flex items-center gap-[7px]">
            <span className="text-[12px]/[16px] font-semibold text-foreground-400">
              {p.name}
            </span>
            {p.type?.name && (
              <Badge className="px-[7px] py-[2px] rounded-sm">
                <span className="text-[10px] text-foreground-200">
                  {p.type.name}
                </span>
              </Badge>
            )}
            {(p.description || p.summary) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InfoIcon className="size-3" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-[#F3F3F3] p-[8px] max-w-[300px]"
                  >
                    <div>{p.description ?? p.summary}</div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {isPrimitive(p.schema) ? (
            <Input
              type="text"
              className={cn(
                "bg-input focus-visible:bg-input caret-foreground placeholder:text-[#262A27] px-[10px] py-[7px] border-none",
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
              placeholder=""
            />
          ) : (
            <ParamEditor
              id={p.id}
              name={p.name}
              schema={p.schema}
              className="rounded-sm"
              value={p.value}
              onChange={(value) => onChange(i, value ?? "")}
              onSubmit={(value) => onSubmit?.(i, value ?? "")}
              readOnly={disabled}
            />
          )}
        </div>
      ))}
    </div>
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
          minimap: {
            enabled: false,
          },
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

// Recursively render a form for a JSON schema
export function JsonSchemaForm({
  schema,
  value,
  onChange,
  disabled = false,
  path = [],
}: {
  schema: JsonSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (value: any) => void;
  disabled?: boolean;
  path?: string[];
}) {
  // Remove any reference to oneOfMode or all-fields, always use select for oneOf at any depth
  if (schema.oneOf) {
    // Use state to track selected branch
    const selectedIdx =
      typeof value?.__oneOfSelected__ === "number"
        ? value.__oneOfSelected__
        : 0;
    const branchValue =
      value?.__oneOfValue__ ??
      (schema.oneOf[selectedIdx]?.type === "object"
        ? {}
        : schema.oneOf[selectedIdx]?.type === "array"
          ? []
          : "");
    return (
      <div className="flex flex-col gap-[8px]">
        <Select
          value={selectedIdx}
          onValueChange={(e) => {
            const idx = Number(e);
            onChange({
              __oneOfSelected__: idx,
              __oneOfValue__:
                schema.oneOf[idx]?.type === "object"
                  ? {}
                  : schema.oneOf[idx]?.type === "array"
                    ? []
                    : "",
            });
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {schema.oneOf.map((option: any, idx: number) => (
              <SelectItem key={idx} value={idx}>
                {option.title || `Option ${idx + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <JsonSchemaForm
          schema={schema.oneOf[selectedIdx]}
          value={branchValue}
          onChange={(v) =>
            onChange({ __oneOfSelected__: selectedIdx, __oneOfValue__: v })
          }
          disabled={disabled}
          path={path}
        />
      </div>
    );
  }
  // Handle allOf (merge all subschemas into one object)
  if (schema.allOf) {
    // Merge all properties and required fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mergedProps: Record<string, any> = {};
    let mergedRequired: string[] = [];
    const mergedSchema = {
      type: "object",
      properties: {},
      required: [] as string[],
    };
    for (const sub of schema.allOf) {
      if (sub.type === "object" && sub.properties) {
        mergedProps = { ...mergedProps, ...sub.properties };
        if (Array.isArray(sub.required)) {
          mergedRequired = [...mergedRequired, ...sub.required];
        }
      }
    }
    mergedSchema.properties = mergedProps;
    mergedSchema.required = mergedRequired;
    return (
      <JsonSchemaForm
        schema={mergedSchema}
        value={value}
        onChange={onChange}
        disabled={disabled}
        path={path}
      />
    );
  }
  // Handle object
  if (schema.type === "object" && schema.properties) {
    return (
      <div className="flex flex-col gap-[8px] p-[8px] rounded bg-background-100">
        {Object.entries(schema.properties).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ([key, propSchema]: [string, any]) => (
            <div key={key} className="flex flex-col gap-[4px]">
              {
                <label className="text-xs font-semibold">
                  {formatSnakeCaseToDisplayValue(key)}
                  {schema.required?.includes(key) ? " *" : null}
                </label>
              }
              <JsonSchemaForm
                schema={propSchema}
                value={value?.[key] ?? ""}
                onChange={(v) => onChange({ ...value, [key]: v })}
                disabled={disabled}
                path={[...path, key]}
              />
            </div>
          ),
        )}
      </div>
    );
  }
  // Handle array
  if (schema.type === "array" && schema.items) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const arr: any[] = Array.isArray(value) ? value : [];
    return (
      <div className="flex flex-col gap-[8px] p-[8px] rounded bg-background-100">
        {arr.map((item, idx) => (
          <div key={idx} className="flex flex-row gap-[8px] items-center">
            <JsonSchemaForm
              schema={schema.items}
              value={item}
              onChange={(v) => {
                const newArr = arr.slice();
                newArr[idx] = v;
                onChange(newArr);
              }}
              disabled={disabled}
              path={[...path, String(idx)]}
            />
            <button
              type="button"
              onClick={() => {
                const newArr = arr.slice();
                newArr.splice(idx, 1);
                onChange(newArr);
              }}
              disabled={disabled}
              className="text-xs text-red-500"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...arr, ""])}
          disabled={disabled}
          className="text-xs text-blue-500 self-start"
        >
          Add item
        </button>
      </div>
    );
  }
  // Handle primitive
  if (
    schema.type === "string" ||
    schema.type === "number" ||
    schema.type === "integer" ||
    schema.type === "boolean"
  ) {
    return (
      <Input
        type={
          schema.type === "boolean"
            ? "checkbox"
            : schema.type === "number" || schema.type === "integer"
              ? "number"
              : "text"
        }
        checked={schema.type === "boolean" ? Boolean(value) : undefined}
        value={schema.type === "boolean" ? undefined : (value ?? "")}
        onChange={(e) => {
          let v: string | number | boolean = e.target.value;
          if (schema.type === "boolean") v = e.target.checked;
          if (schema.type === "number" || schema.type === "integer")
            v = e.target.value === "" ? "" : Number(e.target.value);
          onChange(v);
        }}
        disabled={disabled}
        className="bg-input focus-visible:bg-input border-none caret-foreground font-sans px-[10px] py-[5px] h-[30px] rounded-sm"
      />
    );
  }
  // Fallback: show as text
  return (
    <Input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="bg-input focus-visible:bg-input border-none caret-foreground font-sans px-[10px] py-[5px] h-[30px] rounded-sm"
    />
  );
}
