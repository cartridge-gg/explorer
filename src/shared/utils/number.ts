export function padNumber(num: number, size: number = 3) {
  let s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}

export function formatNumber(num: number) {
  return num.toLocaleString();
}

/**
 *
 * @param num Number to abbreviate
 * @param decimalPlaces Number of decimal places to round to
 * @returns Abbreviated number string
 * @example
 * abbreviateNumber(1234567890); // Returns "1.23B"
 * abbreviateNumber(1234567890, 2); // Returns "1.23B"
 * abbreviateNumber(1234567890, 0); // Returns "1B"
 */
export function abbreviateNumber(
  num: number,
  decimalPlaces: number = 1,
): string {
  const SI_SYMBOLS = ["", "K", "M", "B", "T"]; // K for thousands, M for millions, B for billions, T for trillions

  // Handle negative numbers by converting to positive for calculation and adding a negative sign later
  const isNegative = num < 0;
  const absoluteNum = Math.abs(num);

  // Determine the appropriate tier (thousands, millions, etc.)
  const tier = Math.floor(Math.log10(absoluteNum) / 3);

  // If the number is zero or smaller than 1000, no abbreviation is needed
  if (tier === 0 || isNaN(tier) || !isFinite(tier)) {
    return num.toString();
  }

  // Get the suffix based on the tier
  const suffix = SI_SYMBOLS[tier] || "";

  // Calculate the scaled number
  const scale = Math.pow(10, tier * 3);
  const scaledNum = absoluteNum / scale;

  // Format the scaled number and append the suffix
  let formattedNum = scaledNum.toFixed(decimalPlaces);

  // Remove trailing .0 if present for whole numbers (e.g., 1.0K becomes 1K)
  if (formattedNum.endsWith(".0")) {
    formattedNum = formattedNum.slice(0, -2);
  }

  return (isNegative ? "-" : "") + formattedNum + suffix;
}
