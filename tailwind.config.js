/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#6366f1', // Indigo-500
          dark: '#818cf8',  // Indigo-400
          hover: {
            light: '#4f46e5', // Indigo-600
            dark: '#6366f1'   // Indigo-500
          }
        },
        secondary: {
          light: '#9333ea', // Purple-600
          dark: '#a855f7',  // Purple-500
          hover: {
            light: '#7e22ce', // Purple-700
            dark: '#9333ea'   // Purple-600
          }
        },
        background: {
          light: '#ffffff',
          dark: '#1f2937',  // Gray-800
          alt: {
            light: '#f9fafb', // Gray-50
            dark: '#111827'   // Gray-900
          }
        },
        text: {
          primary: {
            light: '#111827', // Gray-900
            dark: '#f9fafb'   // Gray-50
          },
          secondary: {
            light: '#4b5563', // Gray-600
            dark: '#9ca3af'   // Gray-400
          },
          muted: {
            light: '#6b7280', // Gray-500
            dark: '#6b7280'   // Gray-500
          }
        },
        border: {
          light: '#e5e7eb', // Gray-200
          dark: '#374151'   // Gray-700
        },
        success: {
          light: '#059669', // Emerald-600
          dark: '#34d399'   // Emerald-400
        },
        error: {
          light: '#dc2626', // Red-600
          dark: '#f87171'   // Red-400
        }
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-in-out',
        'slide-up': 'slideUp 1s ease-in-out',
        'slide-down': 'slideDown 1s ease-in-out',
        'scale-in': 'scaleIn 1s ease-in-out',
        'nav-click': 'navClick 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'nav-item': 'navItem 0.3s ease-out',
        'theme-toggle': 'themeToggle 0.5s ease-in-out',
        'menu-expand': 'menuExpand 0.3s ease-out',
        'menu-collapse': 'menuCollapse 0.3s ease-in',
        'blob': 'blob 10s infinite ease-in-out',
        'blob-spin': 'blob-spin 30s linear infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        navClick: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' }
        },
        navItem: {
          '0%': { transform: 'translateY(-2px)', opacity: '0.7' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        themeToggle: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        menuExpand: {
          '0%': { opacity: '0', transform: 'scaleY(0.95)' },
          '100%': { opacity: '1', transform: 'scaleY(1)' }
        },
        menuCollapse: {
          '0%': { opacity: '1', transform: 'scaleY(1)' },
          '100%': { opacity: '0', transform: 'scaleY(0.95)' }
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -30px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' }
        },
        'blob-spin': {
          '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
          '100%': { transform: 'translate(-50%, -50%) rotate(360deg)' }
        }
      },
    },
  },
  plugins: [],
}
