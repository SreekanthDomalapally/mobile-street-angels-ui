/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        charcoal: {
          50: "#f6f6f6",
          100: "#e7e7e7",
          200: "#d1d1d1",
          300: "#b0b0b0",
          400: "#888888",
          500: "#6d6d6d",
          600: "#5d6d82",
          700: "#3d5270",
          800: "#152E52",
          900: "#0F2442",
          950: "#0B1B32",
        },
        emergency: {
          DEFAULT: "#c94a4a",
          muted: "#8b3a3a",
          glow: "#e85d5d",
        },
        responder: {
          DEFAULT: "#4a8f6a",
          muted: "#3a6f55",
          light: "#6bb892",
        },
        glass: {
          DEFAULT: "rgba(255,255,255,0.08)",
          border: "rgba(255,255,255,0.12)",
        },
      },
      fontFamily: {
        sans: ["System"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
