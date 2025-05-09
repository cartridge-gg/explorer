import { Editor, Monaco } from "@monaco-editor/react"
import { editor } from "monaco-editor";
import { useCallback } from "react"

export function ParamEditor({
  name,
  schema,
  value,
  onChange
}: {
  name: string,
  schema: unknown,
  value: string,
  onChange: (value?: string) => void
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
