/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#262626",
        borderGray: "#D0D0D0",
        starknet: {
          primary: "#FF4F0A",
          secondary: "#29296E",
        },
        highlight: {
          primary: "#262626",
          secondary: "white",
        },
      },
      screens: {
        // `slightly large` as it sits between lg and xl
        sl: "1196px",
      },
      fontFamily: {
        sans: ["Space Mono", "monospace"],
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
        sm: "3px",
        DEFAULT: "4px",
        md: "4px",
        lg: "6px",
      },
    },
  },
  plugins: [],
};
