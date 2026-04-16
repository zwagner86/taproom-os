import type { Config } from "tailwindcss";

import { taproomTailwindPreset } from "@taproom/config";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  presets: [taproomTailwindPreset],
};

export default config;

