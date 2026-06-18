import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        lamaSky: "#D0E8FF",          // Light pastel Blue matching Vocali Blue
        lamaSkyLight: "#F0F6FC",     // Very light Blue
        lamaPurple: "#FFE6D5",       // Light pastel Peach/Orange matching Vocali Orange
        lamaPurpleLight: "#FFF5EE",  // Very light Orange/Peach
        lamaYellow: "#FAE27C",       // Soft Yellow
        lamaYellowLight: "#FEFCE8",  // Very light Yellow
        vocaliBlue: "#1872D9",       // Vocali Brand Primary Blue
        vocaliBlueLight: "#EBF3FC",  // Vocali Brand Light Blue
        vocaliOrange: "#F47A20",     // Vocali Brand Primary Orange
        vocaliOrangeLight: "#FFF3EB",// Vocali Brand Light Orange
      },
    },
  },
  plugins: [],
};
export default config;
