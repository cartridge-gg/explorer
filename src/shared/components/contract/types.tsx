import { AbiEntry } from "starknet";

export type FunctionInputWithValue = AbiEntry & {
  value: string;
};

export type ConstructorAbi = { inputs: AbiEntry[] };
