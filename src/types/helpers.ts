// All codes here are taken from https://github.com/starknet-io/starknet.js/blob/e0ae07738c87bc40caf9c912bdf910b9053d5f2b/src/provider/types/spec.type.ts#L17

// taken from type-fest
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

// taken from type-fest
export type RequiredKeysOf<T extends object> = Exclude<
  {
    [K in keyof T]: T extends Record<K, T[K]> ? K : never;
  }[keyof T],
  undefined
>;

type ArrayElement<T> = T extends Array<infer U> ? U : never;

type MergeProperties<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T1 extends Record<any, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T2 extends Record<any, any>,
> = {
  [K in RequiredKeysOf<T1> & RequiredKeysOf<T2>]: Merge<T1[K], T2[K]>;
} & {
  [K in keyof T1 & keyof T2]?: Merge<T1[K], T2[K]>;
} & {
  [K in Exclude<keyof T1, keyof T2>]?: T1[K];
} & {
  [K in Exclude<keyof T2, keyof T1>]?: T2[K];
};

/**
   *  type a = { w: bigint[]; x: bigint; y: string };
   type b = { w: number[]; x: number; z: string };
   type c = Merge<a, b>; // { w: (bigint | number)[] x: bigint | number; y?: string; z?: string; }

   NOTE: handling for ambiguous overlaps, such as a shared property being an array or object,
   is simplified to resolve to only one type since there shouldn't be such occurrences in the
   currently supported RPC specifications
   */
export type Merge<T1, T2> = Simplify<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T1 extends Array<any>
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      T2 extends Array<any>
      ? Array<Merge<ArrayElement<T1>, ArrayElement<T2>>>
      : T1
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      T2 extends Array<any>
      ? T2
      : T1 extends object
        ? T2 extends object
          ? MergeProperties<T1, T2>
          : T1
        : T2 extends object
          ? T2
          : T1 | T2
>;

/**
 * Merges multiple types into a single type
 * Usage: MergeMultiple<[Type1, Type2, Type3, ...]>
 *
 * Example:
 * type a = { w: bigint[]; x: bigint; y: string };
 * type b = { w: number[]; x: number; z: string };
 * type c = { x: boolean; w: string[] };
 * type result = MergeMultiple<[a, b, c]>;
 * // Result: { w: (bigint | number | string)[]; x: bigint | number | boolean; y?: string; z?: string; }
 *
 * For the Transaction page usage:
 * type TransactionUnion = MergeMultiple<[INVOKE_TXN, L1_HANDLER_TXN, DECLARE_TXN, DEPLOY_TXN, DEPLOY_ACCOUNT_TXN]>;
 * // This creates a union type that includes all properties from all transaction types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MergeMultiple<T extends readonly any[]> = T extends readonly [
  infer First,
  ...infer Rest,
]
  ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Rest extends readonly any[]
    ? Rest["length"] extends 0
      ? First
      : Merge<First, MergeMultiple<Rest>>
    : First
  : never;
