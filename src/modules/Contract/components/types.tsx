export type FunctionInput = { name: string; type: string };

export type FunctionInputWithValue = FunctionInput & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
};

export type Function = {
  name: string;
  selector: string;
  inputs: FunctionInput[];
};
