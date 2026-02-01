/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'royal': '#051125',
        'royal-card': '#0f2545',
        'gold': '#D4AF37',
        'gold-glow': '#FFE57F'
      },
      fontFamily: {
        serif: ['Cinzel', 'serif'], 
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 10s linear infinite',
        'blink': 'blink 1s step-end infinite', //
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        }
    }
    }
  },
  plugins: [],
} 