/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ap: {
          gold: '#C8960C',
          'gold-light': '#F5D770',
          'gold-dark': '#8B6508',
          blue: '#003087',
          'blue-light': '#0052CC',
          'blue-dark': '#001A4D',
          green: '#006400',
          'green-light': '#228B22',
          red: '#8B0000',
          'red-light': '#CC0000',
          cream: '#FFFEF5',
          'gray-100': '#F8F9FA',
          'gray-200': '#E9ECEF',
          'gray-300': '#DEE2E6',
          'gray-400': '#CED4DA',
          'gray-500': '#ADB5BD',
          'gray-600': '#6C757D',
          'gray-700': '#495057',
          'gray-800': '#343A40',
          'gray-900': '#212529',
        }
      },
      fontFamily: {
        'display': ['Georgia', 'Times New Roman', 'serif'],
        'body': ['Segoe UI', 'system-ui', 'sans-serif'],
        'mono': ['Consolas', 'Monaco', 'monospace'],
      },
      backgroundImage: {
        'ap-gradient': 'linear-gradient(135deg, #003087 0%, #0052CC 50%, #003087 100%)',
        'gold-gradient': 'linear-gradient(135deg, #C8960C 0%, #F5D770 50%, #C8960C 100%)',
        'header-gradient': 'linear-gradient(180deg, #003087 0%, #0044BB 100%)',
      },
      boxShadow: {
        'gov': '0 2px 8px rgba(0, 48, 135, 0.15)',
        'gov-lg': '0 4px 20px rgba(0, 48, 135, 0.2)',
        'card': '0 1px 4px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideIn: { '0%': { transform: 'translateX(-10px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
      }
    },
  },
  plugins: [],
}
