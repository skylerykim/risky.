import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // brand: "ri" pink + "sky" purple
        risk: "#f9a8d4", // light pink
        sky: "#a855f7", // aesthetic purple
        skyDeep: "#7c3aed",
        ink: "#0b0710", // near-black canvas
        ink2: "#140d1c", // raised surface
        ink3: "#1e1430", // card/border
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(168,85,247,0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
