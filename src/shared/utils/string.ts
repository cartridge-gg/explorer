// truncate string to show first and last n characters
export function truncateString(str: string, n: number = 6) {
  return str?.length > n
    ? str.substring(0, n - 1) + "..." + str.substring(str?.length - n)
    : str;
}

export function formatVariableToDisplay(variable: string) {
  if (!variable) return "";
  return variable.replace(/_/g, " ").toUpperCase();
}
