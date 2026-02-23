/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        agro: {
          earth: '#8B6914',
          sky: '#87CEEB',
          field: '#228B22',
          gold: '#DAA520',
          sunset: '#FF8C00',
        },
        dark: {
          bg: '#0f1117',
          card: '#1a1d26',
          border: '#2a2d36',
          text: '#e4e4e7',
          muted: '#71717a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)',
      },
    },
  },
  plugins: [],
};
