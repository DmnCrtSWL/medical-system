/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mint: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        navy: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          800: '#0F172A',
          900: '#0A2540',
        },
      },
    },
  },
  plugins: [],
}
