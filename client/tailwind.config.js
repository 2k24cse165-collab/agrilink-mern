/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        soil: {
          50: "#faf7f0",
          100: "#f3ebda",
          200: "#e7d6b3",
          300: "#d9bb83",
          400: "#cc9f57",
          500: "#bd8536",
          600: "#a36a2c",
          700: "#854e26",
          800: "#6c3f25",
          900: "#5a3522",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
