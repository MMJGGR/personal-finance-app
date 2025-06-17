/* eslint-env node */
/* global module, require */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        amber: {
          100: '#fef3c7',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
