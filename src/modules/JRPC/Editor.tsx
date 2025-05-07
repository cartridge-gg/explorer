import { Editor, Monaco } from "@monaco-editor/react"
import { editor } from "monaco-editor";
import { useCallback } from "react"

export function ParamEditor({
  method,
  param,
  value,
  onChange
}: {
  method: string,
  param: string,
  value?: string,
  onChange: (value: string) => void
}) {
  const onMount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    const uri = monaco.Uri.parse(`file:///${method}.json`)
    let model = monaco.editor.getModel(uri);
    if (!model) {
      const initialValue = value ?? "";
      model = monaco.editor.createModel(initialValue, "json", uri);
      editor.setModel(model);

      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [
          ...(monaco.languages.json.jsonDefaults.diagnosticsOptions
            ?.schemas || []),
          {
            uri: `schema://${method}.json`,
            fileMatch: [uri.toString()],
            schema: getScheme(method, param),
          },
        ],
      });
    }

    // Listen for model content changes
    model.onDidChangeContent(() => {
      const value = model?.getValue();
      if (!value) {
        return
      }

      onChange(value);
    });
    editor.setModel(model)
  }, [method, value])

  return (
    <Editor
      className="z-0"
      height={200}
      language="json"
      onMount={onMount}
      options={{
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
    />

  )
}

function getScheme(method: string, param: string) {
  return {
    type: "object",
    title: method,
    properties: {},
  }
}
