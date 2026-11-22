/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
          400: '#4ade80', 500: '#16a34a', 600: '#15803d', 700: '#166534',
          800: '#14532d', 900: '#064e3b',
        },
        gold: {
          100: '#fef9c3', 300: '#fde047', 400: '#facc15', 500: '#eab308', 600: '#ca8a04',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Noto Sans Kannada', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
