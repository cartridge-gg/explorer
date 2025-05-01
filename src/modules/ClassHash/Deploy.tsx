import { ConstructorAbi, FunctionInputWithValue } from "@/shared/components/contract/types";
import { useToast } from "@/shared/components/toast";
import { useAccount } from "@starknet-react/core";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DeployContractResponse, RawArgsObject, uint256 } from "starknet";

export function Deploy({ classHash, constructor }: { classHash: string, constructor: ConstructorAbi }) {
  const { toast } = useToast();
  const { account } = useAccount();
  const initialInputs = useMemo(() => constructor.inputs.map(input => ({
    name: input.name,
    type: input.type,
    value: ""
  })), [constructor.inputs]);
  const [form, setForm] = useState<{
    inputs: FunctionInputWithValue[]
    error?: string;
    result?: DeployContractResponse;
  }>({
    inputs: initialInputs
  });
  const [isDeploying, setIsDeploying] = useState(false);

  const onInputChange = useCallback((name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(form => ({
      ...form,
      inputs: form.inputs.map(input =>
        input.name === name
          ? { ...input, value: e.target.value }
          : input
      )
    }));
  }, []);

  const onDeploy = useCallback(async () => {
    if (!account) {
      return;
    }

    setIsDeploying(true);
    try {
      const result = await account.deployContract({
        classHash: classHash,
        constructorCalldata: toRawArgs(form.inputs)
      });
      setForm(form => ({
        ...form,
        inputs: initialInputs,
        result
      }));

      toast(
        (
          <div>
            Contract {" "}
            <Link to={`/contract/${result.contract_address}`} className="underline">
              {result.contract_address}
            </Link>{" "}
            is deployed successfully at tx: {" "}
            <Link to={`/tx/${result.transaction_hash}`} className="underline">
              {result.transaction_hash}
            </Link>
          </div>
        ),
        "success"
      );
    } catch (error) {
      toast(`Failed to deploy contract: ${error}`, "error");
    } finally {
      setIsDeploying(false);
    }
  }, [account, classHash, form, toast, initialInputs]);

  return (
    <div className="bg-white flex flex-col gap-3 mt-[6px] px-[15px] py-[17px] border border-borderGray overflow-auto">
      {!account && (
        <div className="text-sm text-red-500">
          Please connect your account to deploy a contract
        </div>
      )}

      {!!constructor.inputs.length && (
        <table className="bg-white overflow-x w-full">
          <tbody>
            {constructor.inputs.map((input, idx) => (
              <tr
                key={idx}
                className={`${idx !== constructor.inputs.length - 1 ? "border-b" : ""}`}
              >
                <td className="px-2 py-1 text-left align-top w-[90px] italic">
                  <span>{input.name}</span>
                </td>

                <td className="text-left align-top p-0">
                  <input
                    type="text"
                    className="px-2 py-1 text-left w-full"
                    placeholder={`${input.type}`}
                    value={form.inputs[idx]!.value}
                    onChange={onInputChange(input.name)}
                    disabled={!account || isDeploying}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button
        className="bg-primary text-white px-4 py-2 self-start hover:bg-primary/80 disabled:bg-primary/50"
        onClick={onDeploy}
        disabled={!account || isDeploying}
      >
        {isDeploying ? "Deploying..." : "Deploy"}
      </button>
    </div>
  )
}

function toRawArgs(inputs: FunctionInputWithValue[]) {
  return inputs.reduce((acc, input) => ({ ...acc, [input.name]: toMultiType(input) }), {} as RawArgsObject);
}

function toMultiType(input: FunctionInputWithValue) {
  switch (input.type) {
    case "Uint256":
      return uint256.bnToUint256(input.value);
    default:
      return BigInt(input.value);
  }
}
