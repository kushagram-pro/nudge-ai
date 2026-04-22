/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        mist: "#f6f8fb",
        signal: "#0f766e",
        coral: "#f97316",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(16, 24, 40, 0.08)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
