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
          50: '#EEF3FC',
          100: '#E3EDFB',
          200: '#C6D7F7',
          300: '#9DB7F1',
          500: '#4D72E8',
          600: '#3D5FD9',
          700: '#334FC0',
          800: '#2A418F',
          900: '#4D72E8',
          950: '#16213A',
        },
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
        sand: 'rgb(var(--color-sand) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        card: 'rgb(var(--color-card) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          soft: 'rgb(var(--color-ink-soft) / <alpha-value>)',
          faint: 'rgb(var(--color-ink-faint) / <alpha-value>)',
        },
        gold: {
          100: '#FBF3D0',
          200: '#F7E8A8',
          300: '#E8C93A',
          400: '#D9B82E',
          500: '#C4A525',
          600: '#9E8A20',
          700: '#7C6C16',
        },
        clay: {
          100: '#FDE4E4',
          200: '#FAC9C9',
          300: '#F5A3A5',
          500: '#E5484D',
          600: '#D13A3F',
          700: '#B22E33',
        },
        accent: {
          blue: '#4D72E8',
          teal: '#2FD4C4',
          pink: '#EE4B7B',
          amber: '#E8C93A',
        },
        teal: {
          50: '#E4F8F4',
          100: '#C9F0E8',
          500: '#2FD4C4',
          700: '#0E9183',
          800: '#0C6E64',
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: '0 1px 2px rgba(30, 41, 59, 0.04), 0 8px 24px -12px rgba(30, 41, 59, 0.10)',
        ticket: '0 2px 4px rgba(30, 41, 59, 0.05), 0 18px 50px -20px rgba(30, 41, 59, 0.22)',
        primary: '0 8px 18px rgba(77, 114, 232, 0.25)',
      },
    },
  },
  plugins: [],
};
