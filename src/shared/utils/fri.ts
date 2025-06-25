/**
 * Utility functions for formatting FRI (Felt Resource Identifier) values
 * FRI is the smallest unit, similar to wei in Ethereum
 *
 * Units:
 * - FRI: 1
 * - KFRI: 1,000 FRI (10^3)
 * - MFRI: 1,000,000 FRI (10^6)
 * - GFRI: 1,000,000,000 FRI (10^9)
 */

export type FriUnit = "FRI" | "KFRI" | "MFRI" | "GFRI";

interface FriFormatResult {
  value: string;
  unit: FriUnit;
}

const FRI_UNITS = {
  GFRI: 1_000_000_000,
  MFRI: 1_000_000,
  KFRI: 1_000,
  FRI: 1,
} as const;

/**
 * Formats a FRI value to the most appropriate unit
 * @param valueInFri - The value in FRI (smallest unit)
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Object with formatted value and unit
 */
export function formatFri(
  valueInFri: number | string | bigint,
  decimals: number = 2,
): FriFormatResult {
  const numValue =
    typeof valueInFri === "bigint" ? Number(valueInFri) : Number(valueInFri);

  if (isNaN(numValue) || numValue === 0) {
    return { value: "0", unit: "FRI" };
  }

  // Find the most appropriate unit
  for (const [unit, divisor] of Object.entries(FRI_UNITS)) {
    if (Math.abs(numValue) >= divisor) {
      const convertedValue = numValue / divisor;

      // Format the number with appropriate decimal places
      const formatted =
        convertedValue < 1
          ? convertedValue.toFixed(Math.max(decimals, 4)) // Show more decimals for small values
          : convertedValue.toFixed(decimals);

      // Remove trailing zeros after decimal point
      const cleanFormatted = formatted.replace(/\.?0+$/, "");

      return {
        value: cleanFormatted,
        unit: unit as FriUnit,
      };
    }
  }

  // Fallback to FRI for very small values
  return {
    value: numValue.toString(),
    unit: "FRI",
  };
}

/**
 * Formats a FRI value to a specific unit
 * @param valueInFri - The value in FRI (smallest unit)
 * @param targetUnit - The target unit to convert to
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Formatted value string
 */
export function formatFriToUnit(
  valueInFri: number | string | bigint,
  targetUnit: FriUnit,
  decimals: number = 2,
): string {
  const numValue =
    typeof valueInFri === "bigint" ? Number(valueInFri) : Number(valueInFri);

  if (isNaN(numValue)) {
    return "0";
  }

  const divisor = FRI_UNITS[targetUnit];
  const convertedValue = numValue / divisor;

  const formatted = convertedValue.toFixed(decimals);
  // Remove trailing zeros after decimal point
  return formatted.replace(/\.?0+$/, "");
}

/**
 * Get the display label for a FRI unit (lowercase)
 * @param unit - The FRI unit
 * @returns Lowercase unit label
 */
export function getFriUnitLabel(unit: FriUnit): string {
  return unit.toLowerCase();
}
