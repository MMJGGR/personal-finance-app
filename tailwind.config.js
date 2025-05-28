module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        amber: {
          100: '#fef3c7',
          600: '#d97706',
          700: '#b45309',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
