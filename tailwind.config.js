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
        white: {
          100: '#FFFFFF',
          200: '#FAFAFA',
        },
        grey: {
          100: '#ececec',
          200: '#d6d6d6'
        },
        blue: {
          100: '#E6E6E6',
          200: '#F2F6F7',
          300: '#E6EEEF',
          400: '#0000ff'
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