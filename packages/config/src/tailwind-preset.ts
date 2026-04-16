export const taproomTailwindPreset = {
  theme: {
    extend: {
      colors: {
        ink: "#171410",
        parchment: "#f6f0e5",
        ember: "#c96b2c",
        pine: "#244130",
        brass: "#c9a25f",
        mist: "#e8dfcf",
      },
      boxShadow: {
        panel: "0 18px 50px rgba(23, 20, 16, 0.12)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      fontFamily: {
        display: ["'Bricolage Grotesque'", "system-ui", "sans-serif"],
        body: ["'Instrument Sans'", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "grain-warm":
          "radial-gradient(circle at top left, rgba(201,107,44,0.18), transparent 34%), radial-gradient(circle at bottom right, rgba(36,65,48,0.18), transparent 32%)",
      },
    },
  },
};
