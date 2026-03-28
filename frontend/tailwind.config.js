/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#e5eefc",
        mist: "#02050b",
        accent: "#22d3ee",
        coral: "#f97316"
      },
      boxShadow: {
        panel: "0 24px 80px rgba(2, 6, 23, 0.55)"
      }
    }
  },
  plugins: [],
};
