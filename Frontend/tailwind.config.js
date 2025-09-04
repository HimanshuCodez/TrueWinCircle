/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }, // Move left by half
        },
      },
      animation: {
        marquee: "marquee 15s linear infinite", // Adjust speed here
      },
    },
  },
  plugins: [],
}