import { Accordion, AccordionItem } from "@/shared/components/accordion";
import { useAccount } from "@starknet-react/core";
import { useCallback, useMemo, useState } from "react";
import { AccountInterface, Contract, InvokeFunctionResponse } from "starknet";
import * as types from "./types";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import AddIcon from "@/shared/icons/ Add";
import { useCallCartDispatch } from "@/store/ShoppingCartProvider";

// The state of the <FunctionCallAccordionContent/> component
type FunctionCallAccordionContentState = {
  inputs: types.FunctionInputWithValue[];
  result: InvokeFunctionResponse | null;
  hasCalled: boolean;
  loading: boolean;
  error: any;
};

export interface ContractWriteInterfaceProps {
  contract: Contract;
  functions?: types.Function[];
}

export default function ContractWriteInterface({
  contract,
  functions = [],
}: ContractWriteInterfaceProps) {
  const { address, account } = useAccount();

  // Create a state object to persist input values across accordion openings/closings
  const [functionItemStates, setFunctionEntryStates] = useState<{
    // a map from the function name to its state (ie AccordionItem content states)
    [key: string]: FunctionCallAccordionContentState;
  }>({});

  const updateFunctionItemState = useCallback(
    (
      functionName: string,
      update: Partial<FunctionCallAccordionContentState>
    ) => {
      setFunctionEntryStates((prev) => ({
        ...prev,
        [functionName]: {
          ...(prev[functionName] || {
            inputs: [],
            error: null,
            result: null,
            hasCalled: false,
            loading: false,
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
                account={account}
                address={address}
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
  args: { name: string; type: string }[];
  /** Current state of the accordion content, including inputs, results and errors */
  state?: FunctionCallAccordionContentState;
  /** Callback to update the state of this accordion item in order to preserve the state */
  onUpdateState: (update: Partial<FunctionCallAccordionContentState>) => void;
  /** Connected account */
  account?: AccountInterface;
  /** Connected address */
  address: string | undefined;
}

function FunctionCallAccordionContent({
  args,
  contract,
  functionName,
  onUpdateState,
  account,
  address,
  state = {
    inputs: [],
    hasCalled: false,
    error: null,
    result: null,
    loading: false,
  },
}: FunctionCallAccordionContentProps) {
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

  const { addCall, isWalletConnected } = useCallCartDispatch();

  const handleAddToCart = useCallback(() => {
    if (!contract || !isWalletConnected) {
      return;
    }

    const calldata = inputs.map((i) => i.value);

    addCall({
      contractAddress: contract.address,
      entrypoint: functionName,
      calldata: calldata,
    });
  }, [inputs, contract, functionName, addCall, isWalletConnected]);

  const handleFunctionCall = useCallback(async () => {
    if (!contract || !account) {
      onUpdateState({
        error: "Please connect your wallet first",
        result: null,
        loading: false,
        hasCalled: true,
      });
      return;
    }

    onUpdateState({ loading: true, hasCalled: true });

    const calldata = inputs.map((i) => i.value);

    try {
      const result = await account.execute([
        {
          contractAddress: contract.address,
          entrypoint: functionName,
          calldata: calldata,
        },
      ]);

      onUpdateState({ result, error: null, loading: false });
    } catch (error) {
      console.error("failed to execute contract", error);
      onUpdateState({ error, result: null, loading: false });
    }
  }, [inputs, contract, account, functionName, onUpdateState]);

  return (
    <div className="flex flex-col gap-[10px] items-end">
      <div className="flex gap-2">
        <button
          onClick={handleAddToCart}
          disabled={!isWalletConnected}
          className={`bg-white w-[19px] h-[19px] flex items-center justify-center border ${
            !isWalletConnected
              ? "border-gray-300 text-gray-300 cursor-not-allowed"
              : "border-borderGray hover:border-0 hover:bg-primary hover:text-white cursor-pointer"
          }`}
          title={
            !isWalletConnected || !address
              ? "Please connect your wallet first"
              : "Add to cart"
          }
        >
          <AddIcon />
        </button>

        <button
          disabled={!address || state.loading}
          onClick={handleFunctionCall}
          className={`px-3 py-[2px] text-sm uppercase font-bold w-fit text-white ${
            !address || state.loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary hover:bg-[#6E6E6E]"
          }`}
          title={
            !address
              ? "Please connect your wallet first"
              : state.loading
              ? "Transaction in progress"
              : ""
          }
        >
          {state.loading ? "Executing..." : "Execute"}
        </button>
      </div>

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
            {state.loading ? (
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
  data: InvokeFunctionResponse;
}

function FunctionCallResult({ data }: FunctionCallResultProps) {
  const navigate = useNavigate();

  const handleTxClick = useCallback(
    (txHash: string) => {
      navigate(ROUTES.TRANSACTION_DETAILS.urlPath.replace(":txHash", txHash));
    },
    [navigate]
  );

  return (
    <div className="px-3 py-2 border border-borderGray">
      <p className="">Transaction Hash</p>
      <a
        onClick={() => handleTxClick(data.transaction_hash)}
        className="underline hover:text-borderGray break-all cursor-pointer"
      >
        {data.transaction_hash}
      </a>
    </div>
  );
}
