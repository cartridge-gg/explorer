import { Accordion, AccordionItem } from "@/shared/components/accordion";
import FeltDisplay from "@/shared/components/FeltDisplay";
import FeltDisplayAsToggle, {
  FeltDisplayVariants,
} from "@/shared/components/FeltDisplayAsToggle";
import FeltList from "@/shared/components/FeltList";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState, useMemo } from "react";
import {
  Abi,
  Calldata,
  Contract,
  FunctionAbi,
  Result,
} from "starknet";
import * as types from "./types";
import {
  convertToCalldata,
  FunctionAst,
  getFunctionAst,
} from "@/shared/utils/abi";
import FunctionArgEditor from "@/shared/components/FunctionInputEditor";

// // Optional: Configure loader to use CDN
// loader.config({
//   paths: {
//     vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs",
//   },
// });

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
  /** Current state of the accordion content, including inputs, results and errors */
  state?: FunctionCallAccordionContentState;
  /** Callback to update the state of this accordion item in order to preserve the state */
  onUpdateState: (update: Partial<FunctionCallAccordionContentState>) => void;
}

function FunctionCallAccordionContent({
  ast,
  contract,
  onUpdateState,
  state = { inputs: [], hasCalled: false, error: null, result: null },
}: FunctionCallAccordionContentProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const handleFunctionCall = useCallback(() => {
    if (!contract) return;

    setLoading(true);

    let calldata: Calldata = [];

    state.inputs.forEach((input, idx) => {
      calldata = calldata.concat(
        convertToCalldata(ast.inputs[idx].type, input.value)
      );
    });

    if (!state.hasCalled) {
      onUpdateState({ hasCalled: true });
    }

    queryClient
      .fetchQuery({
        queryKey: [ast.name, ...calldata],
        queryFn: () =>
          contract.call(ast.name, calldata, { parseRequest: false }),
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
    ast,
    contract,
    queryClient,
    state.inputs,
    onUpdateState,
    state.hasCalled,
  ]);

  const handleInputChange = useCallback(
    (inputIndex: number, value: any) => {
      const newInputs = [...state.inputs];
      newInputs[inputIndex] = {
        ...newInputs[inputIndex],
        value: value,
      };
      onUpdateState({ inputs: newInputs });
    },
    [state, onUpdateState]
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

      {ast.inputs.length !== 0 ? (
        <table className="bg-white overflow-x w-full">
          <tbody>
            {ast.inputs.map((input, idx) => (
              <tr
                key={idx}
                className={`${idx !== ast.inputs.length - 1 ? "border-b" : ""}`}
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
                      onChange={(e) => handleInputChange(idx, e.target.value)}
                      value={
                        idx < state.inputs.length
                          ? state.inputs[idx]?.value
                          : undefined
                      }
                    />
                  ) : (
                    <FunctionArgEditor
                      key={idx}
                      functionName={ast.name}
                      argInfo={input}
                      onChange={(value) => handleInputChange(idx, value)}
                      value={
                        idx < state.inputs.length
                          ? state.inputs[idx].value
                          : input.type.type === "struct"
                            ? "{\n\t\n}"
                            : input.type.type === "array"
                              ? "[\n\t\n]"
                              : ""
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
