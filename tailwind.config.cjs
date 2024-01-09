/** @type {import('tailwindcss').Config}*/
const config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
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
          100: '#F2F6F7',
          200: '#E6EEEF',
          300: '#0000ff'
        },
        red: {
          100: '#ff0000'
        }
      }
    }
  },
  plugins: []
};

module.exports = config;