/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        muted: {
          orange: "#b86b2b",
        },
      },
      fontFamily: {
        sans: [
          "SF Pro Text",
          "-apple-system",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(0,0,0,0.06)",
      },
      borderRadius: {
        mdx: "12px",
      }
    },
  },
  plugins: [],
}
