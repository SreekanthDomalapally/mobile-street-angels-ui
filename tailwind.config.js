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
          600: "#5d5d5d",
          700: "#4f4f4f",
          800: "#2a2a2e",
          900: "#1a1a1e",
          950: "#0f0f12",
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
