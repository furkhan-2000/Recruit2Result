/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'elite-bg': '#050505',
        'elite-card': 'rgba(20, 20, 20, 0.6)',
        'elite-accent': '#2563eb',
        'elite-glass-border': 'rgba(255, 255, 255, 0.1)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'subtle-pulse': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
