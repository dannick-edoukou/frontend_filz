/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        pine: {
          50: '#F0F5F2',
          100: '#E3ECE8',
          200: '#C6D8D1',
          600: '#2E5A50',
          800: '#1B463E',
          900: '#12332D',
          950: '#0B2420',
        },
        paper: '#F6F3EB',
        sand: '#EEE9DC',
        line: '#E2DCCC',
        ink: {
          DEFAULT: '#1B231F',
          soft: '#5F6B64',
          faint: '#90998F',
        },
        gold: {
          100: '#F9EFD9',
          300: '#E9C172',
          400: '#E3B04B',
          500: '#D09A33',
          600: '#B57F22',
          700: '#9A6E1D',
        },
        clay: {
          100: '#F7E5DC',
          300: '#E5A48D',
          500: '#C05337',
          700: '#96391F',
        },
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: '0 1px 2px rgba(18, 51, 45, 0.04), 0 8px 24px -12px rgba(18, 51, 45, 0.10)',
        ticket: '0 2px 4px rgba(18, 51, 45, 0.05), 0 18px 50px -20px rgba(18, 51, 45, 0.22)',
      },
    },
  },
  plugins: [],
};
