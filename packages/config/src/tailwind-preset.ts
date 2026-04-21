export const taproomTailwindPreset = {
  theme: {
    extend: {
      colors: {
        // Core design tokens (hex approximations of design's oklch values)
        ink: "#1E1A11",         // oklch(18% 0.02 60) — near-black
        parchment: "#F6F1EC",   // oklch(97% 0.008 75) — warm white
        ember: "#C9782C",       // oklch(62% 0.18 65) — amber accent
        "ember-light": "#FEF0DA", // oklch(96% 0.05 65) — accent-light
        "ember-dark": "#8B4D10",  // oklch(45% 0.18 65) — accent-dark
        mist: "#EDE8E1",        // oklch(94% 0.01 75) — surface-2
        rim: "#DDD8D0",         // oklch(88% 0.012 70) — border
        muted: "#7B7370",       // oklch(52% 0.015 70) — muted text
        sidebar: "#181410",     // oklch(13% 0.02 55) — dark sidebar

      },
      fontFamily: {
        display: ["'Lora'", "Georgia", "serif"],   // editorial headers
        body: ["'DM Sans'", "system-ui", "sans-serif"], // UI
      },
      boxShadow: {
        panel: "0 1px 3px rgba(0,0,0,0.04)",
        modal: "0 20px 60px rgba(0,0,0,0.18)",
        card: "0 4px 24px rgba(0,0,0,0.07)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
};
