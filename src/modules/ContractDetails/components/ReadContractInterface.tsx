import { Accordion, AccordionItem } from "@/shared/components/accordion";
import FeltDisplay from "@/shared/components/FeltDisplay";
import FeltDisplayAsToggle, {
  FeltDisplayVariants,
} from "@/shared/components/FeltDisplayAsToggle";
import FeltList from "@/shared/components/FeltList";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState, useMemo } from "react";
import { Contract, Result } from "starknet";
import * as types from "./types";

// The state of the <FunctionCallAccordionContent/> component
type FunctionCallAccordionContentState = {
  inputs: types.FunctionInputWithValue[];
  hasCalled: boolean;
  result: Result | null;
  error: any;
};

export interface ContractReadInterfaceProps {
  contract: Contract;
  functions?: types.Function[];
}

export default function ContractReadInterface({
  contract,
  functions = [],
}: ContractReadInterfaceProps) {
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
            title={
              <div className="flex flex-row items-center gap-2">
                <span className="font-bold">fn</span>
                <span className="italic">{func.name}</span>
                <span>({func.inputs.map((arg) => arg.name).join(", ")})</span>
              </div>
            }
            content={
              <FunctionCallAccordionContent
                key={index}
                contract={contract}
                functionName={func.name}
                args={func.inputs}
                state={functionItemStates[func.name]}
                onUpdateState={(update) =>
                  updateFunctionItemState(func.name, update)
                }
              />
            }
          />
        ))
      }
    />
  );
}

interface FunctionCallAccordionContentProps {
  /** The contract instance to interact with */
  contract: Contract;
  /** The name of the function to call on the contract */
  functionName: string;
  /** The function's input arguments definition */
  args: types.FunctionInput[];
  /** Current state of the accordion content, including inputs, results and errors */
  state?: FunctionCallAccordionContentState;
  /** Callback to update the state of this accordion item in order to preserve the state */
  onUpdateState: (update: Partial<FunctionCallAccordionContentState>) => void;
}

function FunctionCallAccordionContent({
  args,
  contract,
  functionName,
  onUpdateState,
  state = { inputs: [], hasCalled: false, error: null, result: null },
}: FunctionCallAccordionContentProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  // Initialize input values or return existing ones
  // If there are no inputs yet and args are provided, create initial input state with empty values
  const inputs = useMemo(() => {
    if (state.inputs.length === 0 && args.length > 0) {
      const initialInputs = args.map((arg) => ({
        name: arg.name,
        type: arg.type,
        value: "",
      }));

      onUpdateState({ inputs: initialInputs });
      return initialInputs;
    } else {
      return state.inputs;
    }
  }, [args, state.inputs, onUpdateState]);

  const handleFunctionCall = useCallback(() => {
    setLoading(true);

    const calldata = inputs.map((i) => i.value);

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
    inputs,
    contract,
    queryClient,
    functionName,
    onUpdateState,
    state.hasCalled,
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
      <button
        disabled={loading}
        onClick={handleFunctionCall}
        className={`px-3 py-[2px] text-sm uppercase font-bold w-fit  ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-primary hover:bg-[#6E6E6E]"
        } text-white`}
      >
        {loading ? "Calling..." : "Call"}
      </button>

      {args.length !== 0 ? (
        <table className="bg-white overflow-x w-full">
          <tbody>
            {args.map((input, idx) => (
              <tr
                key={idx}
                className={`${idx !== args.length - 1 ? "border-b" : ""}`}
              >
                <td className="px-2 py-1 text-left align-top w-[90px] italic">
                  <span>{input.name}</span>
                </td>

                <td className="text-left align-top p-0">
                  <input
                    type="text"
                    className="px-2 py-1 text-left w-full"
                    placeholder={`${input.type}`}
                    value={inputs[idx]?.value || ""}
                    onChange={(e) => handleInputChange(idx, e.target.value)}
                  />
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
