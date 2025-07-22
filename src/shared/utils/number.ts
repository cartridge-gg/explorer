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
export function abbreviateNumber(n: number, decimalPlaces: number = 1) {
  return Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: decimalPlaces,
  }).format(n);
  // if (n < 1e3) return n;
  // // Could use 'if (n < 1e6)' if you like
  // if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(decimalPlaces) + "K";
  // // Could use 'if (n < 1e9)' if you like
  // if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(decimalPlaces) + "M";
  // // Could use 'if (n < 1e12)' if you like
  // if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(decimalPlaces) + "B";
  // if (n >= 1e12) return +(n / 1e12).toFixed(decimalPlaces) + "T";
}
