import { cartridgeTWPreset } from "@cartridge/ui/preset";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "./node_modules/@cartridge/ui/dist/**/*.{js,jsx}",
  ],
  presets: [cartridgeTWPreset],
  theme: {
    extend: {
      screens: {
        // `slightly large` as it sits between lg and xl
        sl: "1196px",
      },
      fontSize: {
        xs: "9px",
        sm: "10px",
        base: "11px",
        md: "13px",
        lg: "13px",
      },
      borderRadius: {
        xs: "2px",
        sm: "4px",
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
      },
    },
  },
};
