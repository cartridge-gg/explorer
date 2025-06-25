/**
 * Utility functions for formatting WEI values
 * Wei is the smallest unit in Ethereum
 *
 * Units:
 * - Wei: 1
 * - Kwei: 1,000 Wei (10^3)
 * - Mwei: 1,000,000 Wei (10^6)
 * - Gwei: 1,000,000,000 Wei (10^9)
 * - Ether: 1,000,000,000,000,000,000 Wei (10^18)
 */

import { BigNumberish } from "starknet";

export type WeiUnit = "Wei" | "Kwei" | "Mwei" | "Gwei" | "Ether";

interface WeiFormatResult {
  value: string;
  unit: WeiUnit;
}

const WEI_UNITS = {
  Ether: 1_000_000_000_000_000_000,
  Gwei: 1_000_000_000,
  Mwei: 1_000_000,
  Kwei: 1_000,
  Wei: 1,
} as const;

/**
 * Formats a Wei value to the most appropriate unit
 * @param valueInWei - The value in Wei (smallest unit)
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Object with formatted value and unit
 */
export function formatWei(
  valueInWei: BigNumberish,
  decimals: number = 2,
): WeiFormatResult {
  const numValue =
    typeof valueInWei === "bigint" ? Number(valueInWei) : Number(valueInWei);

  if (isNaN(numValue) || numValue === 0) {
    return { value: "0", unit: "Wei" };
  }

  // Find the most appropriate unit
  for (const [unit, divisor] of Object.entries(WEI_UNITS)) {
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
        unit: unit as WeiUnit,
      };
    }
  }

  // Fallback to Wei for very small values
  return {
    value: numValue.toString(),
    unit: "Wei",
  };
}

/**
 * Formats a Wei value to a specific unit
 * @param valueInWei - The value in Wei (smallest unit)
 * @param targetUnit - The target unit to convert to
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Formatted value string
 */
export function formatWeiToUnit(
  valueInWei: number | string | bigint,
  targetUnit: WeiUnit,
  decimals: number = 2,
): string {
  const numValue =
    typeof valueInWei === "bigint" ? Number(valueInWei) : Number(valueInWei);

  if (isNaN(numValue)) {
    return "0";
  }

  const divisor = WEI_UNITS[targetUnit];
  const convertedValue = numValue / divisor;

  const formatted = convertedValue.toFixed(decimals);
  // Remove trailing zeros after decimal point
  return formatted.replace(/\.?0+$/, "");
}

/**
 * Get the display label for a Wei unit (lowercase)
 * @param unit - The Wei unit
 * @returns Lowercase unit label
 */
export function getWeiUnitLabel(unit: WeiUnit): string {
  return unit.toLowerCase();
}
