/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'satisfy': ['Satisfy', 'cursive']
      },
      colors: {
        'primary': {
          DEFAULT: '#0052cc',
          'hover': '#0041a3',
          'light': '#e6effa',
          'text': '#003380'
        },
        'secondary': '#172b4d',
        'neutral': {
          '50': '#fafbfc',
          '100': '#f1f5f9',
          '200': '#e2e8f0',
          '300': '#cbd5e1',
          '400': '#94a3b8',
          '500': '#64748b',
          '600': '#475569',
          '900': '#0f172a',
        },
        'success': '#00875a',
        'warning': '#ffab00',
        'error': '#de350b',
        'base-100': '#f1f5f9',
        'border-color': '#e2e8f0',
        'status-pendente': '#94a3b8',
        'status-execucao-continua': '#64748b',
        'status-reforcadas-expansao': ' #8b5cf6',
        'status-intensificadas-otimizadas': '#f59e0b',
        'status-ajustadas-execucao': '#3b82f6',
        'status-reforco-monitorado': '#0ea5e9',
        'status-concluida': '#22c55e',
        'status-em-atraso': '#ef4444'
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)',
        'card': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.07)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in-up': 'slideInUp 0.3s ease-in-out',
        'highlight-fade': 'highlightAndFade 1.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideInUp: {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        highlightAndFade: {
          '0%': { backgroundColor: '#e6effa' },
          '100%': { backgroundColor: 'transparent' }
        }
      }
    }
  },
  plugins: [],
} // A VÍRGULA EXTRA FOI REMOVIDA DAQUI