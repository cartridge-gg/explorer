import { createJsonSchemaFromTypeNode, ArgumentNode } from "../utils/abi";
import { editor } from "monaco-editor";
import { Editor, Monaco } from "@monaco-editor/react";
import { useCallback } from "react";

interface FunctionInputEditorProps {
  functionName: string;
  argInfo: ArgumentNode;
  value?: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export default function FunctionInputEditor({
  functionName,
  argInfo,
  value,
  onChange,
  readOnly = false,
}: FunctionInputEditorProps) {
  const handleEditorDidMount = useCallback(
    (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
      // Create a unique model ID for this input
      const modelId = `${functionName}_${argInfo.name}`;

      // Create a unique URI for this model
      const uri = monaco.Uri.parse(`file:///${modelId}.json`);

      // Get or create the model for this input
      let model = monaco.editor.getModel(uri);
      if (!model) {
        const initialValue = value ?? "";
        model = monaco.editor.createModel(initialValue, "json", uri);
        editor.setModel(model);

        // Create JSON schema for this input
        const schema = createJsonSchemaFromTypeNode(argInfo.type);

        // Configure JSON validation just for this model's URI
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          schemas: [
            ...(monaco.languages.json.jsonDefaults.diagnosticsOptions
              ?.schemas || []),
            {
              uri: `schema://${argInfo.type.value.name}.json`,
              fileMatch: [uri.toString()],
              schema,
            },
          ],
        });
      }

      // Listen for model content changes
      model.onDidChangeContent(() => {
        const value = model?.getValue() || null;
        if (value) {
          onChange(value);
        }
      });
    },
    [argInfo, functionName, onChange, value]
  );

  return (
    <Editor
      className="z-0"
      height={200}
      language="json"
      onMount={(editor, monaco: Monaco) => handleEditorDidMount(editor, monaco)}
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
    />
  );
}
