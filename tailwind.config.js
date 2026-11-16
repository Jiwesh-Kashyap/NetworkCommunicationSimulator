/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        network: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          primary: '#3b82f6',
          pc: '#0284c7',
          router: '#ea580c',
          switch: '#16a34a',
          server: '#9333ea',
        }
      },
      keyframes: {
        pulseBorder: {
          '0%, 100%': { borderColor: 'rgba(59, 130, 246, 0.4)' },
          '50%': { borderColor: 'rgba(59, 130, 246, 1)' },
        }
      },
      animation: {
        'pulse-border': 'pulseBorder 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
