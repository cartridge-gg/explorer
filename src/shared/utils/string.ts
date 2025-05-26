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
  return variable.replace(/_/g, " ").toUpperCase();
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
