export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#172026",
        mint: "#16a085",
        coral: "#f9735b",
        amber: "#f3b33d",
        steel: "#54748b"
      }
    }
  },
  plugins: []
};
