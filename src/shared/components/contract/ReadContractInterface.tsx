import { Accordion, AccordionItem } from "@/shared/components/accordion";
import FeltDisplay from "@/shared/components/FeltDisplay";
import FeltDisplayAsToggle, {
  FeltDisplayVariants,
} from "@/shared/components/FeltDisplayAsToggle";
import FeltList from "@/shared/components/FeltList";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState, useMemo, useRef } from "react";
import {
  Abi,
  AbiEntry,
  CallData,
  Contract,
  FunctionAbi,
  Result,
} from "starknet";
import * as types from "./types";
import { Editor, Monaco, loader } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import {
  createJsonSchemaFromTypeNode,
  FunctionAst,
  getFunctionAst,
  InputNode,
} from "@/shared/utils/abi3";

// Optional: Configure loader to use CDN
loader.config({
  paths: {
    vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs",
  },
});

// The state of the <FunctionCallAccordionContent/> component
type FunctionCallAccordionContentState = {
  inputs: types.FunctionInputWithValue[];
  hasCalled: boolean;
  result: Result | null;
  error: Error | string | null;
};

export interface ContractReadInterfaceProps {
  contract?: Contract;
  functions: FunctionAbi[];
  abi: Abi;
}

export function ContractReadInterface({
  contract,
  functions,
  abi,
}: ContractReadInterfaceProps) {
  const functionsAst = useMemo<Record<string, FunctionAst>>(() => {
    const map: Record<string, FunctionAst> = {};

    functions.forEach((fnAbi) => {
      const ast = getFunctionAst(abi, fnAbi.name);
      if (ast !== null) {
        map[fnAbi.name] = ast;
      }
    });

    return map;
  }, [abi, functions]);

  // Create a state object to persist input values across accordion openings/closings
  const [functionItemStates, setFunctionEntryStates] = useState<{
    // a map from the function name to its state (ie AccordionItem content states)
    [key: string]: FunctionCallAccordionContentState;
  }>({});

  const updateFunctionItemState = useCallback(
    (
      functionName: string,
      update: Partial<(typeof functionItemStates)[string]>
    ) => {
      setFunctionEntryStates((prev) => ({
        ...prev,
        [functionName]: {
          ...(prev[functionName] || {
            inputs: [],
            error: null,
            result: null,
            hasCalled: false,
          }),
          ...update,
        },
      }));
    },
    []
  );

  return (
    <Accordion
      items={() =>
        functions.map((func, index) => (
          <AccordionItem
            key={index}
            titleClassName="h-[45px] z-50"
            title={
              <div className="flex flex-row items-center gap-2">
                <span className="font-bold">fn</span>
                <span className="italic">{func.name}</span>
                <span>({func.inputs.map((arg) => arg.name).join(", ")})</span>
              </div>
            }
            content={
              <FunctionCallAccordionContent
                ast={functionsAst[func.name]}
                key={index}
                contract={contract}
                functionName={func.name}
                args={func.inputs}
                state={functionItemStates[func.name]}
                onUpdateState={(update) => {
                  updateFunctionItemState(func.name, update);
                }}
              />
            }
            disabled={!contract && !func.inputs.length}
          />
        ))
      }
    />
  );
}

interface FunctionCallAccordionContentProps {
  /** The contract instance to interact with */
  contract?: Contract;
  ast: FunctionAst;
  /** The name of the function to call on the contract */
  functionName: string;
  /** The function's input arguments definition */
  args: AbiEntry[];
  /** Current state of the accordion content, including inputs, results and errors */
  state?: FunctionCallAccordionContentState;
  /** Callback to update the state of this accordion item in order to preserve the state */
  onUpdateState: (update: Partial<FunctionCallAccordionContentState>) => void;
}

function FunctionCallAccordionContent({
  ast,
  args,
  contract,
  functionName,
  onUpdateState,
  state = { inputs: [], hasCalled: false, error: null, result: null },
}: FunctionCallAccordionContentProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const editorsRef = useRef<Record<string, editor.IStandaloneCodeEditor>>({});
  const [editorModels, setEditorModels] = useState<Record<string, string>>({});

  function handleEditorDidMount(
    inputName: string,
    input: InputNode,
    editor: editor.IStandaloneCodeEditor,
    monaco: Monaco
  ) {
    // Store the editor reference for this input
    editorsRef.current[inputName] = editor;
    editor.focus();

    // Create a unique model ID for this input
    const modelId = `${functionName}_${inputName}`;

    // Create a unique URI for this model
    const uri = monaco.Uri.parse(`file:///${modelId}.json`);

    // Get or create the model for this input
    let model = monaco.editor.getModel(uri);
    if (!model) {
      // Create default content based on input type
      const defaultContent =
        input.type.type === "struct"
          ? "{\n\t\n}"
          : input.type.type === "array"
            ? "[\n\t\n]"
            : "";

      // Create a new model with the uri
      model = monaco.editor.createModel(
        editorModels[inputName] || defaultContent,
        "json",
        uri
      );

      // Set this model for the editor
      editor.setModel(model);

      // Create JSON schema for this input
      const schema = createJsonSchemaFromTypeNode(input.type);
      console.log("fucking schema", modelId, schema);

      // Configure JSON validation just for this model's URI
      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        schemas: [
          ...(monaco.languages.json.jsonDefaults.diagnosticsOptions?.schemas ||
            []),
          {
            uri: `schema://${modelId}.json`,
            fileMatch: [uri.toString()],
            schema,
          },
        ],
      });
    }

    // Listen for model content changes
    model.onDidChangeContent(() => {
      setEditorModels((prev) => ({
        ...prev,
        [inputName]: model?.getValue() || "",
      }));
    });
  }

  // Initialize input values or return existing ones
  // If there are no inputs yet and args are provided, create initial input state with empty values
  const inputs = useMemo(() => {
    if (state.inputs.length === 0 && args.length > 0) {
      const initialInputs = args.map((arg) => ({
        name: arg.name,
        type: arg.type,
        value: "",
      }));

      if (contract) {
        onUpdateState({ inputs: initialInputs });
      }
      return initialInputs;
    } else {
      return state.inputs;
    }
  }, [args, state.inputs, onUpdateState, contract]);

  const handleFunctionCall = useCallback(() => {
    if (!contract) return;

    setLoading(true);

    let calldata;

    if (Object.keys(editorsRef.current).length === 0) {
      console.error("no editor found");
      calldata = inputs.map((i) => i.value);
      console.log("caldata", calldata);
    } else {
      // Collect all editor values from complex inputs
      const complexArgs: Record<string, any> = {};

      for (const [inputName, editor] of Object.entries(editorsRef.current)) {
        try {
          const argsString = editor.getValue();
          const args = JSON.parse(argsString);
          complexArgs[inputName] = args;
        } catch (e) {
          console.error(`Failed to parse input ${inputName}:`, e);
        }
      }

      // For primitive inputs, use the stored values
      const allArgs = inputs.map((input) => {
        if (input.name in complexArgs) {
          return complexArgs[input.name];
        }
        return input.value;
      });

      calldata = CallData.toCalldata(allArgs);
    }

    if (!state.hasCalled) {
      onUpdateState({ hasCalled: true });
    }

    queryClient
      .fetchQuery({
        queryKey: [functionName, ...calldata],
        queryFn: () => contract.call(functionName, calldata),
      })
      .then((result) => {
        onUpdateState({ result, error: null });
      })
      .catch((error) => {
        console.error("failed to call contract", error);
        onUpdateState({ error, result: null });
      })
      .finally(() => setLoading(false));
  }, [
    contract,
    queryClient,
    functionName,
    onUpdateState,
    state.hasCalled,
    inputs,
  ]);

  const handleInputChange = useCallback(
    (inputIndex: number, value: string) => {
      const newInputs = [...inputs];
      newInputs[inputIndex] = {
        ...newInputs[inputIndex],
        value: value,
      };
      onUpdateState({ inputs: newInputs });
    },
    [inputs, onUpdateState]
  );

  return (
    <div className="flex flex-col gap-[10px] items-end">
      {contract && (
        <button
          disabled={loading}
          onClick={handleFunctionCall}
          className={`px-3 py-[2px] text-sm uppercase font-bold w-fit  ${loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-primary hover:bg-[#6E6E6E]"
            } text-white`}
        >
          {loading ? "Calling..." : "Call"}
        </button>
      )}

      {args.length !== 0 ? (
        <table className="bg-white overflow-x w-full">
          <tbody>
            {ast.inputs.map((input, idx) => (
              <tr
                key={idx}
                className={`${idx !== args.length - 1 ? "border-b" : ""}`}
              >
                <td className="px-2 py-1 text-left align-top w-[90px] italic">
                  <span>{input.name}</span>
                </td>

                <td className="text-left align-top p-0">
                  {input.type.type === "primitive" ? (
                    <input
                      type="text"
                      className="px-2 py-1 text-left w-full"
                      placeholder={`${input.type.value.name}`}
                      value={inputs[idx]?.value || ""}
                      onChange={(e) => handleInputChange(idx, e.target.value)}
                    />
                  ) : (
                    <Editor
                      height={200}
                      language="json"
                      onMount={(editor, monaco: Monaco) =>
                        handleEditorDidMount(input.name, input, editor, monaco)
                      }
                      options={{
                        selectOnLineNumbers: true,
                        roundedSelection: false,
                        readOnly: false,
                        cursorStyle: "line",
                        automaticLayout: true,
                        suggestOnTriggerCharacters: true,
                        snippetSuggestions: "inline",
                        scrollbar: {
                          useShadows: false,
                          verticalHasArrows: true,
                          horizontalHasArrows: true,
                          vertical: "visible",
                          horizontal: "visible",
                          verticalScrollbarSize: 17,
                          horizontalScrollbarSize: 17,
                          arrowSize: 30,
                        },
                      }}
                      value={
                        editorModels[input.name] ||
                        (input.type.type === "struct"
                          ? "{\n\t\n}"
                          : input.type.type === "array"
                            ? "[\n\t\n]"
                            : "")
                      }
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <></>
      )}

      {state.hasCalled ? (
        <div className="w-full flex flex-col gap-1">
          <p className="font-bold text-sm uppercase">Result</p>

          <div className="bg-white">
            {loading ? (
              <div className="text-gray-600">Loading...</div>
            ) : state.error ? (
              <div className="text-red-500 p-3 bg-red-50 border border-red-200">
                <p className="font-medium">Error:</p>
                <p className="text-sm">{state.error.toString()}</p>
              </div>
            ) : state.result !== null ? (
              <FunctionCallResult data={state.result} />
            ) : null}
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}

interface FunctionCallResultProps {
  data: Result;
}

function FunctionCallResult({ data }: FunctionCallResultProps) {
  const [display, setDisplay] = useState<FeltDisplayVariants>("hex");

  return (
    <div className="px-3 py-2  border border-borderGray flex flex-col gap-3">
      {Array.isArray(data) ? (
        <FeltList list={data as bigint[]} displayAs="hex" />
      ) : (
        <>
          <FeltDisplayAsToggle
            onChange={(value) => setDisplay(value as FeltDisplayVariants)}
            asString={true}
          />
          <FeltDisplay value={data} displayAs={display} />
        </>
      )}
    </div>
  );
}
