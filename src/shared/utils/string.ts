// truncate string to show first and last n characters
export function truncateString(str: string, n: number = 6): string {
  if (!str) return "";

  if (str.startsWith("0x")) {
    // Don't count the 0x prefix for truncation calculations
    const contentStr = str.substring(2);
    return contentStr.length > n * 2
      ? str.substring(0, n + 2) + "..." + str.substring(str.length - n)
      : str;
  }

  return str.length > n * 2
    ? str.substring(0, n) + "..." + str.substring(str.length - n)
    : str;
}

export function formatSnakeCaseToDisplayValue(variable: string) {
  if (!variable) return "";
  return variable
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function fromCamelCase(str: string) {
  if (!str) return "";
  const [first, ...rest] = str.replace(/([A-Z])/g, " $1");
  return [first.toUpperCase(), ...rest].join("");
}

export function toHash(str: string) {
  return "#" + str.replace(" ", "-").toLowerCase();
}

export function isNumber(str: string): boolean {
  return !isNaN(str as unknown as number);
}

/**
 * Stringify the data to a human readable format.
 * @param value - The value to stringify. Which usually represents a data fetched from the chain.
 * @returns The stringified data.
 */
export function stringifyData(value: unknown): string {
  if (typeof value === "bigint") {
    return `0x${value.toString(16)}`;
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stringifyData(item)).join(", ")}]`;
  }
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(
      Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, stringifyData(v)]),
      ),
    );
  }
  return String(value);
};
