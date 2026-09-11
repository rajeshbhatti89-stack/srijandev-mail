export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F6F8FC',
        surface: '#FFFFFF',
        surfaceHover: '#F2F6FC',
        surfaceActive: '#D3E3FD',
        surfaceHighlight: '#EAF1FB',
        primary: '#0B57D0',
        primaryHover: '#0842A0',
        primaryLight: '#C2E7FF',
        primaryLightText: '#001D35',
        textMain: '#1F1F1F',
        textMuted: '#444746',
        textSubtle: '#747775',
        borderDark: '#E0E2EC',
        borderLight: '#EDF0F7',
        gmailStar: '#F9AB00',
        gmailRed: '#D93025',
      },
      fontFamily: {
        sans: ['Google Sans', 'Roboto', 'Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'gmail': '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
        'gmail-compose': '0 4px 8px 3px rgba(60,64,67,0.15), 0 1px 3px rgba(60,64,67,0.3)',
        'gmail-dropdown': '0 2px 6px 2px rgba(60,64,67,0.15), 0 1px 2px 0 rgba(60,64,67,0.3)',
        'gmail-card': '0 1px 2px 0 rgba(60,64,67,0.1), 0 2px 6px 2px rgba(60,64,67,0.05)',
      }
    },
  },
  plugins: [],
}
