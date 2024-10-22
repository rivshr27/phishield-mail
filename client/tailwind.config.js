/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        warm: {
          50: "#FFF8F0",
          100: "#FFE8D6",
          200: "#FFD4A3",
          300: "#FFB970",
          400: "#FFA246",
          500: "#FF8930",
          600: "#E67928",
          700: "#CC681F",
          800: "#B25618",
          900: "#8C4310",
        },
      },
    },
  },

  plugins: [],
};
