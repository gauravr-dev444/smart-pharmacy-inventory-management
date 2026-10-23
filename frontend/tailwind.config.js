/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          dark: '#1D4ED8',
          light: '#60A5FA',
          slate: '#1E293B',
        },
        secondary: {
          DEFAULT: '#14B8A6',
          dark: '#0F766E',
          light: '#2DD4BF',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        darkBg: '#0F172A',
        darkCard: '#1E293B',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
