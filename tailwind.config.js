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
        obsidian: {
          DEFAULT: '#000000',
          card: '#0a0a0c',
          card2: '#121215',
          border: '#27272a',
          hover: '#18181b',
        },
        steel: {
          rail: '#f4f4f5',
          amber: '#f59e0b',
          green: '#10b981',
          cyan: '#38bdf8',
          red: '#ef4444',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
