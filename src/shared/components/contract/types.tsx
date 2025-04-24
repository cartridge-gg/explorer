export type FunctionInput = { name: string; type: string };

export type FunctionInputWithValue = FunctionInput & {
  value: string;
};

export type Function = {
  name: string;
  selector: string;
  inputs: FunctionInput[];
};

export type Constructor = {
  inputs: FunctionInput[];
};
