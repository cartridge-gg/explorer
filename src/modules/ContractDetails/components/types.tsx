export type FunctionInput = { name: string; type: string };

export type FunctionInputWithValue = FunctionInput & {
  value: any;
};

export type Function = {
  name: string;
  selector: string;
  inputs: FunctionInput[];
};
