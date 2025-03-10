/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Mono', 'monospace'],
      },
      fontSize: {
        'xs': '9px',
        'sm': '11px',
        'base': '11px',
        'md': '13px',
        'lg': '13px',
      },
      borderRadius: {
        'sm': '3px',
        'DEFAULT': '4px',
        'md': '4px',
        'lg': '6px',
      },
    },
  },
  plugins: [],
};
