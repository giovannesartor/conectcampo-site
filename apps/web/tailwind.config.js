/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta derivada das cores reais da logo ConectCampo
        brand: {
          50:  '#f0fdf5',
          100: '#d0f9e4',
          200: '#a0f2c8',
          300: '#5de6a0',
          400: '#29ce72',
          500: '#00a03c', // verde vivo da logo (C direito, claro)
          600: '#008c3c', // verde vivo da logo (C direito, core)
          700: '#006830',
          800: '#003c28', // verde escuro da logo (C esquerdo)
          900: '#002818',
          950: '#001410',
        },
        agro: {
          earth: '#8B6914',
          sky:   '#87CEEB',
          field: '#003c28', // verde escuro da logo
          gold:  '#b48c3c', // dourado do ponto da logo
          sunset:'#d97706',
        },
        dark: {
          bg:     '#0a0f0c',
          card:   '#131a14',
          border: '#1e2d20',
          text:   '#e4e7e4',
          muted:  '#6b7a6d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        // Gradiente usando os verdes escuros da logo (C esquerdo)
        'hero-pattern': 'linear-gradient(135deg, #001410 0%, #003c28 55%, #006830 100%)',
      },
    },
  },
  plugins: [],
};
