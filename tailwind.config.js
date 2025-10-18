/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'bochan': ['var(--font-bochan)', 'serif'],
        'roboto': ['var(--font-roboto)', 'sans-serif'],
        'heading': ['var(--font-bochan)', 'serif'],
        'body': ['var(--font-roboto)', 'sans-serif'],
      },
      colors: {
        // Brand semantic tokens
        brand: {
          bg: '#163237',      // Deep teal background
          surface: '#1D4148', // Lighter teal surface
          gold: '#eab308',    // Primary gold (yellow-500)
          goldLight: '#ECE97F', // Light gold highlights (accent-200)
          aqua: '#677A7D',    // Cyan for info
          orange: '#997146',  // Warm orange
          neutral: '#8C8179', // Neutral gray
          light: '#CCC8BE',   // Light neutral
        },
        // Paleta ajustada para mejor apariencia visual
        primary: {
          50: '#fefdf8',   // Muy claro, casi blanco
          100: '#fef7cd',   // Amarillo muy claro
          200: '#fef08a',   // Amarillo claro
          300: '#fde047',   // Amarillo
          400: '#facc15',   // Amarillo dorado
          500: '#eab308',   // Dorado
          600: '#ca8a04',   // Dorado oscuro
          700: '#a16207',   // Marrón dorado
          800: '#854d0e',   // Marrón
          900: '#713f12',   // Marrón oscuro
        },
        warm: {
          50: '#fefdf8',    // Muy claro
          100: '#f5f3f0',   // Gris muy claro
          200: '#CCC8BE',   // Gris cálido - COLOR EXACTO
          300: '#d4cbc0',   // Gris cálido más oscuro
          400: '#8C8179',   // Gris marrón cálido - COLOR EXACTO
          500: '#997146',   // Marrón tierra - COLOR EXACTO
          600: '#8a6a3d',   // Marrón más oscuro
          700: '#7a5f35',   // Marrón muy oscuro
          800: '#6b542d',   // Marrón muy oscuro
          900: '#1D4148',   // Verde azulado oscuro - COLOR EXACTO
        },
        accent: {
          50: '#fefdf8',    // Muy claro
          100: '#fefce8',   // Amarillo muy claro
          200: '#ECE97F',   // Amarillo claro - COLOR EXACTO
          300: '#fef08a',   // Amarillo
          400: '#fde047',   // Amarillo dorado
          500: '#facc15',   // Dorado
          600: '#eab308',   // Dorado oscuro
          700: '#ca8a04',   // Marrón dorado
          800: '#a16207',   // Marrón
          900: '#854d0e',   // Marrón oscuro
        },
        earth: {
          50: '#fefdf8',    // Muy claro
          100: '#f5f3f0',   // Gris muy claro
          200: '#CCC8BE',   // Gris cálido
          300: '#d4cbc0',   // Gris cálido más oscuro
          400: '#8C8179',   // Gris marrón cálido
          500: '#997146',   // Marrón tierra
          600: '#677A7D',   // Verde azulado medio - COLOR EXACTO
          700: '#5a6b6e',   // Verde azulado más oscuro
          800: '#4d5b5e',   // Verde azulado muy oscuro
          900: '#1D4148',   // Verde azulado oscuro
        },
        // Mantener ocean y sand para compatibilidad
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        sand: {
          50: '#fefdf8',
          100: '#fef7cd',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        }
      },
      backgroundImage: {
        'warm-gradient': 'linear-gradient(135deg, #997146 0%, #8C8179 50%, #CCC8BE 100%)',
        'earth-gradient': 'linear-gradient(135deg, #1D4148 0%, #677A7D 50%, #997146 100%)',
        'surf-gradient': 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #0891b2 100%)',
        'sand-gradient': 'linear-gradient(135deg, #fef7cd 0%, #fde047 50%, #facc15 100%)',
      }
    },
  },
  plugins: [],
} 