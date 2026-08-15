/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#C82333", // Primary Red
          dark: "#A61E2A", // Dark Red
        },
        // Remapping the legacy orange classes to the new Red palette
        orange: {
          50: '#FDE9EB',  // Very Light Red
          100: '#FAD4D8',
          200: '#F4A9B1',
          500: '#C82333', // Primary Red
          600: '#A61E2A', // Dark Red
          700: '#8A1923',
          800: '#6E141C',
          900: '#520F15',
        },
        navy: {
          DEFAULT: "#1F355E", // Navy Blue
          light: "#3F5D8A", // Medium Blue
        },
        green: {
          DEFAULT: "#6E8C75", // Palm Green
          dark: "#708A5A", // Olive Green
        },
        gray: {
          50: "#F4F4F4", // Light Gray
          200: "#D9D9D9", // Soft Gray
          900: "#333333", // Dark Gray Charcoal
        },
        hero: "rgba(34, 58, 94, 0.6)", // Dark Navy Overlay
        background: "#F4F4F4", // Light Gray
        surface: "#FFFFFF", // White
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
