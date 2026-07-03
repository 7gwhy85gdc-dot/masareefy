/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#effaf3',
          100: '#d8f3e1',
          200: '#b3e7c8',
          300: '#81d4a7',
          400: '#4cba81',
          500: '#2aa065',
          600: '#1c8151',
          700: '#176743',
          800: '#155237',
          900: '#12442e',
        },
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Tahoma',
          'Helvetica Neue', 'Arial', 'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
