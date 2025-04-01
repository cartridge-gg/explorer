import { Accordion, AccordionItem } from "@/shared/components/accordion";
import FeltDisplay from "@/shared/components/FeltDisplay";
import FeltDisplayAsToggle, {
  FeltDisplayVariants,
} from "@/shared/components/FeltDisplayAsToggle";
import FeltList from "@/shared/components/FeltList";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { Contract, Result } from "starknet";

export interface ContractReadInterfaceProps {
  contract: Contract;
  functions?: {
    name: string;
    inputs: { name: string; type: string }[];
    selector: string;
  }[];
}

export default function ContractReadInterface({
  contract,
  functions = [],
}: ContractReadInterfaceProps) {
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
              />
            }
          />
        ))
      }
    />
  );
}

type FunctionInput = {
  name: string;
  type: string;
  value: string;
};

interface FunctionCallAccordionContentProps {
  contract: Contract;
  functionName: string;
  args: { name: string; type: string }[];
}

function FunctionCallAccordionContent({
  contract,
  functionName,
  args,
}: FunctionCallAccordionContentProps) {
  const queryClient = useQueryClient();

  const [hasCalled, setHasCalled] = useState(false);
  const [error, setError] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const [inputs, setInputs] = useState<FunctionInput[]>([]);

  const handleFunctionCall = useCallback(() => {
    const calldata = inputs.map((i) => i.value);

    setLoading(true);

    if (!hasCalled) {
      setHasCalled(true);
    }

    queryClient
      .fetchQuery({
        queryKey: [functionName, ...calldata],
        queryFn: () => contract.call(functionName, calldata),
      })
      .then(setResult)
      .catch((error) => {
        console.error("failed to call contract", error);
        setError(error);
      })
      .finally(() => setLoading(false));
  }, [queryClient, contract, functionName, inputs]);

  const handleInputChange = useCallback((inputIndex: number, value: string) => {
    setInputs((prev) => {
      const newInputs = [...(prev || [])];
      newInputs[inputIndex] = {
        ...newInputs[inputIndex],
        value: value,
      };

      return newInputs;
    });
  }, []);

  return (
    <div className="flex flex-col gap-[10px] items-end">
      <button
        disabled={loading}
        onClick={handleFunctionCall}
        className={`px-3 py-[2px] text-sm uppercase font-bold w-fit  ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-[#4A4A4A] hover:bg-[#6E6E6E]"
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

      {hasCalled ? (
        <div className="w-full flex flex-col gap-1">
          <p className="font-bold text-sm uppercase">Result</p>

          <div className="bg-white">
            {loading ? (
              <div className="text-gray-600">Loading...</div>
            ) : error ? (
              <div className="text-red-500 p-3 bg-red-50 border border-red-200">
                <p className="font-medium">Error:</p>
                <p className="text-sm">{error}</p>
              </div>
            ) : result !== null ? (
              <FunctionCallResult data={result} />
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
    <div className="p-3 border border-borderGray flex flex-col gap-3">
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
