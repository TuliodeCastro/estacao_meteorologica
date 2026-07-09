/** @type {import('tailwindcss').Config} */
// Configuração do Tailwind CSS
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Animações personalizadas usadas nos ícones e cards
      animation: {
        'pulso-suave': 'pulsoSuave 3s ease-in-out infinite',
        'flutuar': 'flutuar 4s ease-in-out infinite',
        'aparecer': 'aparecer 0.5s ease-out',
        'pop': 'pop 0.6s ease-out',
        'brilho': 'brilho 2s ease-in-out infinite',
      },
      keyframes: {
        pulsoSuave: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.08)', opacity: '0.9' },
        },
        flutuar: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        aparecer: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { transform: 'scale(0.9)', opacity: '0.4' },
          '60%': { transform: 'scale(1.06)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        brilho: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
    },
  },
  plugins: [],
};
