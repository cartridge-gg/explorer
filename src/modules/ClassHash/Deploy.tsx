import { FunctionAbiWithAst, FunctionInputWithValue } from "@/shared/utils/abi";
import { useToast } from "@/shared/components/toast";
import { useAccount } from "@starknet-react/core";
import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DeployContractResponse, RawArgsObject, uint256 } from "starknet";
import { ParamForm } from "@/shared/form";

export function Deploy({ classHash, constructor }: { classHash: string, constructor: FunctionAbiWithAst }) {
  const { toast } = useToast();
  const { account } = useAccount();
  const initialInputs = useMemo(() => constructor.inputs.map(input => ({
    ...input,
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

  const onInputChange = useCallback((i: number, value: string) => {
    setForm(form => ({
      ...form,
      inputs: form.inputs.map((input, ii) =>
        i == ii
          ? { ...input, value }
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
            <Link to={`../contract/${result.contract_address}`} className="underline">
              {result.contract_address}
            </Link>{" "}
            is deployed successfully at tx: {" "}
            <Link to={`../tx/${result.transaction_hash}`} className="underline">
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

      <ParamForm
        params={constructor.inputs.map((input, i) => ({
          ...input,
          value: form.inputs[i]!.value,
        }))}
        onChange={onInputChange}
        disabled={!account || isDeploying}
      />
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
  switch (input.type.name) {
    case "Uint256":
      return uint256.bnToUint256(input.value);
    default:
      return BigInt(input.value);
  }
}
