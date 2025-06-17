export function isBigInt(value: string) {
  try {
    BigInt(value);
    return true;
  } catch {
    return false;
  }
}
