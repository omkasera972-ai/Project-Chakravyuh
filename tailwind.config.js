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
        command: {
          bg: '#0a0a0c',
          panel: '#111215',
          card: '#14161b',
          cardHover: '#1a1d24',
          border: '#22252d',
          borderLight: '#2e333d',
          muted: '#8e95a5',
          textMuted: '#6b7280',
          textSub: '#9ca3af',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      borderRadius: {
        'card': '10px',
        'badge': '6px',
      },
      boxShadow: {
        'panel': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.35)',
        'glow-green': '0 0 10px rgba(34, 197, 94, 0.3)',
      },
    },
  },
  plugins: [],
}
