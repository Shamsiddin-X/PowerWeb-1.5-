/** @type {import('tailwindcss').Config} */
// NOTE: In Tailwind v4, theme configuration has moved to index.css (@theme block).
// This file is only kept for backward compatibility references.
// The actual config (colors, fonts, dark mode) lives in index.css.
export default {
  content: [
    "./index.html",
    "./*.{ts,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
