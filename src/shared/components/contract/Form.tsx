import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/shared/components/accordion";
import FeltDisplay from "@/shared/components/FeltDisplay";
import FeltDisplayAsToggle, {
  FeltDisplayVariants,
} from "@/shared/components/FeltDisplayAsToggle";
import FeltList from "@/shared/components/FeltList";
import { useCallback, useState } from "react";
import { Contract, InvokeFunctionResponse } from "starknet";
import {
  FunctionAbiWithAst,
  FunctionInputWithValue,
  isReadFunction,
  toCalldata,
} from "@/shared/utils/abi";
import { useAccount } from "@starknet-react/core";
import { Link } from "react-router-dom";
import AddIcon from "@/shared/icons/Add";
import { cn } from "@cartridge/ui";
import { useCallCartDispatch } from "@/store/ShoppingCartProvider";
import { useToast } from "@/shared/components/toast";
import { ParamForm } from "@/shared/components/form";

export interface ContractFormProps {
  contract?: Contract;
  functions: FunctionAbiWithAst[];
}

type FormState = {
  inputs: FunctionInputWithValue[];
  result?: CallResult | InvokeFunctionResponse;
  error?: Error | string;
  hasCalled: boolean;
  loading: boolean;
};

const initFormState: FormState = {
  inputs: [],
  hasCalled: false,
  loading: false,
};

export function ContractForm({ contract, functions }: ContractFormProps) {
  const [form, setForm] = useState<{
    [key: string]: FormState;
  }>({});

  const onUpdate = useCallback(
    (name: string, value: Partial<(typeof form)[string]>) => {
      setForm((prev) => ({
        ...prev,
        [name]: {
          ...(prev[name] || initFormState),
          ...value,
        },
      }));
    },
    [],
  );

  if (!functions.length) {
    return (
      <div className="h-full p-2 flex items-center justify-center min-h-[150px] text-xs lowercase">
        <span className="text-[#D0D0D0]">No functions found</span>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible>
      {functions.map((f, i) => (
        <AccordionItem
          key={i}
          value={f.name}
          className={
            !contract
              ? "first:rounded-t-none last:rounded-b-none border-x-0"
              : undefined
          }
          disabled={!contract && !f.inputs.length}
        >
          <AccordionTrigger hideIcon={!contract && !f.inputs.length}>
            <div className="flex flex-row items-center gap-2">
              <span className="font-bold">fn</span>
              <span className="italic">{f.name}</span>
              <span>({f.inputs.map((arg) => arg.name).join(", ")})</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <FunctionForm
              item={f}
              contract={contract}
              state={form[f.name] || initFormState}
              onUpdate={(update) => onUpdate(f.name, update)}
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

interface FunctionFormProps {
  item: FunctionAbiWithAst;
  /** The contract instance to interact with */
  contract?: Contract;
  /** Current state of the accordion content, including inputs, results and errors */
  state: FormState;
  /** Callback to update the state of this accordion item in order to preserve the state */
  onUpdate: (update: Partial<FormState>) => void;
}

function FunctionForm({
  item: f,
  contract,
  onUpdate,
  state,
}: FunctionFormProps) {
  const { account } = useAccount();
  const isRead = isReadFunction(f);

  const onCallOrExecute = useCallback(async () => {
    if (!contract || (!isRead && !account)) {
      onUpdate({
        error: "Please connect your wallet first",
        result: undefined,
        hasCalled: true,
      });
      return;
    }

    onUpdate({ loading: true });

    try {
      const calldata = state.inputs.flatMap((input, idx) => {
        let value;
        try {
          value = JSON.parse(input.value);
        } catch {
          value = input.value;
        }
        return toCalldata(f.inputs[idx].type, value);
      });

      if (isRead) {
        const result = await contract.call(f.name, calldata, {
          parseRequest: false,
          parseResponse: false,
        });
        onUpdate({ result: result as CallResult, error: undefined });
      } else {
        const result = await account!.execute([
          {
            calldata: calldata,
            entrypoint: f.name,
            contractAddress: contract.address,
          },
        ]);
        onUpdate({ result: result, error: undefined });
      }
    } catch (error) {
      console.error("failed to call contract", error);
      onUpdate({ error: error as Error, result: undefined });
    } finally {
      onUpdate({ hasCalled: true, loading: false });
    }
  }, [f, contract, account, state.inputs, isRead, onUpdate]);

  const onChange = useCallback(
    (inputIndex: number, value: string) => {
      const newInputs = [...state.inputs];
      newInputs[inputIndex] = {
        ...newInputs[inputIndex],
        value,
      };
      onUpdate({ inputs: newInputs });
    },
    [state, onUpdate],
  );

  const { toast } = useToast();
  const { addCall } = useCallCartDispatch();

  const onAddToCart = useCallback(() => {
    if (!contract || isRead || !account) {
      return;
    }

    const calldata = state.inputs.flatMap((input, idx) => {
      let value;
      try {
        value = JSON.parse(input.value);
      } catch {
        value = input.value;
      }
      return toCalldata(f.inputs[idx].type, value);
    });

    addCall({
      calldata: calldata,
      entrypoint: f.name,
      contractAddress: contract.address,
    });
    toast(`Function call added: ${f.name}`, "success");
  }, [toast, contract, f, state.inputs, addCall, account, isRead]);

  return (
    <div className="flex flex-col gap-[10px] items-end">
      {!!contract &&
        (isRead ? (
          <button
            disabled={state.loading}
            onClick={onCallOrExecute}
            className={`px-3 py-[2px] text-sm uppercase font-bold w-fit  ${
              state.loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-primary hover:bg-[#6E6E6E]"
            } text-white`}
          >
            {state.loading ? "Calling..." : "Call"}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onAddToCart}
              disabled={!account}
              className={cn(
                `bg-white w-[19px] h-[19px] flex items-center justify-center border`,
                !account
                  ? "border-gray-300 text-gray-300 cursor-not-allowed"
                  : "border-borderGray hover:border-0 hover:bg-primary hover:text-white cursor-pointer",
              )}
              title={
                !account ? "Please connect your wallet first" : "Add to cart"
              }
            >
              <AddIcon />
            </button>

            <button
              disabled={!account || state.loading}
              onClick={onCallOrExecute}
              className={`px-3 py-[2px] text-sm uppercase font-bold w-fit text-white ${
                !account || state.loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-[#6E6E6E]"
              }`}
              title={
                !account
                  ? "Please connect your wallet first"
                  : state.loading
                    ? "Transaction in progress"
                    : ""
              }
            >
              {state.loading ? "Executing..." : "Execute"}
            </button>
          </div>
        ))}

      <ParamForm
        params={f.inputs.map((input, i) => ({
          ...input,
          value:
            i < state.inputs.length
              ? state.inputs[i]?.value
              : input.type.type === "struct"
                ? "{\n\t\n}"
                : input.type.type === "array"
                  ? "[\n\t\n]"
                  : "",
        }))}
        onChange={(i, value) => onChange(i, value)}
        disabled={!contract || (!isRead && !account)}
      />

      {state.hasCalled && (
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
            ) : state.result ? (
              <FormResult data={state.result} />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

type CallResult = string | string[] | bigint | bigint[];

interface ResultProps {
  data: CallResult | InvokeFunctionResponse;
}

function FormResult({ data }: ResultProps) {
  if (typeof data === "object" && "transaction_hash" in data) {
    return (
      <div className="px-3 py-2 border border-borderGray">
        <p className="">Transaction Hash</p>
        <Link
          to={`../transaction/${data.transaction_hash}`}
          className="underline break-all hover:text-borderGray"
        >
          {data.transaction_hash}
        </Link>
      </div>
    );
  }

  return <CallResult data={data} />;
}

function CallResult({ data }: { data: CallResult }) {
  const [display, setDisplay] = useState<FeltDisplayVariants>("hex");

  return (
    <div className="px-3 py-2 border border-borderGray flex flex-col gap-3">
      <FeltDisplayAsToggle
        onChange={(value) => setDisplay(value as FeltDisplayVariants)}
        asString={true}
      />
      {Array.isArray(data) ? (
        <FeltList list={data as bigint[]} displayAs={display} />
      ) : (
        <FeltDisplay value={data as bigint} displayAs={display} />
      )}
    </div>
  );
}
