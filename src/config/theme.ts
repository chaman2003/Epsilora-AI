export const themeConfig = {
  colors: {
    primary: {
      light: 'indigo-600',
      dark: 'indigo-400',
      hover: {
        light: 'indigo-700',
        dark: 'indigo-500'
      },
      bg: {
        light: 'indigo-50',
        dark: 'indigo-900/20'
      }
    },
    secondary: {
      light: 'purple-600',
      dark: 'purple-400',
      hover: {
        light: 'purple-700',
        dark: 'purple-500'
      },
      bg: {
        light: 'purple-50',
        dark: 'purple-900/20'
      }
    },
    success: {
      light: 'teal-600',
      dark: 'teal-400',
      hover: {
        light: 'teal-700',
        dark: 'teal-500'
      },
      bg: {
        light: 'teal-50',
        dark: 'teal-900/20'
      }
    },
    background: {
      light: 'white',
      dark: 'gray-800',
      page: {
        light: 'slate-50',
        dark: 'slate-900'
      }
    },
    text: {
      primary: {
        light: 'gray-900',
        dark: 'gray-100'
      },
      secondary: {
        light: 'gray-600',
        dark: 'gray-400'
      },
      muted: {
        light: 'gray-500',
        dark: 'gray-500'
      }
    },
    border: {
      light: 'gray-200',
      dark: 'gray-700'
    }
  },
  animation: {
    duration: '1500ms',
    transition: {
      enter: 'transition-all duration-1500 ease-in-out',
      leave: 'transition-all duration-1500 ease-in-out',
      hover: 'transition-all duration-300 ease-in-out'
    }
  }
};
