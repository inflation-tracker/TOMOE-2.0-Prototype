import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // TOMOE brand blue — soft-fintech primary per design/DESIGN.md (blue #3266f0).
        brand: {
          50: "#f3f6ff",
          100: "#e9effe",
          500: "#3266f0",
          600: "#2a59d8",
          700: "#1f47b5",
        },
      },
    },
  },
  plugins: [],
};
export default config;
