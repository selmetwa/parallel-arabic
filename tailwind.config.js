/** @type {import('tailwindcss').Config}*/
const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
      flex: {
        '2': '2 2 0%',
        '3': '3 3 0%'
      },
      fontFamily: {
        'sans': ['Helvetica', 'Arial', 'sans-serif']
      },
      colors: {
        black: '#000000',
        raison: '#2E282A',
        brand: 'var(--brand)',
        tile: {
          100: 'var(--tile1)',
          200: 'var(--tile2)',
          300: 'var(--tile3)',
          400: 'var(--tile4)',
          500: 'var(--tile5)',
          600: 'var(--tile6)',
          700: 'var(--tile6)',
        },
        text: {
          '100': 'var(--text1)',
          '200': 'var(--text2)',
          '300': 'var(--text1)',
        },
        green: {
          '50': '#f0fdf4',
          '100': 'var(--green1)',
          '200': '#bbf7d0',
          '300': '#86efac',
          '400': '#4ade80',
          '500': '#22c55e',
          '600': '#16a34a',
          '700': '#15803d',
        },
        blue: {
          '200': '#bfdbfe',
          '300': '#93c5fd',
          '500': '#0000ff'
        },
        red: {
          '50': '#fef2f2',
          '100': 'var(--red1)',
          '500': '#ef4444',
          '600': '#dc2626',
          '700': '#b91c1c',
        }
      },
      animation: {
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-once': 'bounce-once 0.6s ease-out',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'bounce-once': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-10px)' },
          '75%': { transform: 'translateX(10px)' },
        },
      },
      boxShadow: {
        'inner-lg': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.1)',
      },
      backdropBlur: {
        'xs': '2px',
      },
    }
  },
  plugins: []
};

module.exports = config;