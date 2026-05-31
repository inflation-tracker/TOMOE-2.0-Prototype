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
        // TOMOE brand green — matches landing.html (#28c26c) & PIHPS identity.
        brand: {
          50: "#f2fdf6",
          100: "#e6f9ee",
          500: "#28c26c",
          600: "#22a05a",
          700: "#1a7a42",
        },
      },
    },
  },
  plugins: [],
};
export default config;
