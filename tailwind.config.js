/** @type {import('tailwindcss').Config}*/
const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
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
        },
        text: {
          '100': 'var(--text1)',
          '200': 'var(--text2)',
          '300': 'var(--text1)',
        },
        green: {
          '100': 'var(--green1)',
        },
        blue: {
          500: '#0000ff'
        },
        red: {
          100: '#ff0000'
        }
      },
    }
  },
  plugins: []
};

module.exports = config;