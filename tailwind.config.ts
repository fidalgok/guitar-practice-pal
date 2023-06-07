import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms"
import aspectRatio from "@tailwindcss/aspect-ratio"

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        slideDownAndFade: 'slideDownAndFade 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        slideLeftAndFade: 'slideLeftAndFade 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        slideRightAndFade: 'slideRightAndFade 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        slideUpAndFade: 'slideUpAndFade 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
      },
      keyframes: {
        slideDownAndFade: {
          'from': {
            opacity: '0',
            transform: 'translateY(-2px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        slideLeftAndFade: {
          'from': {
            opacity: '0',
            transform: 'translateX(2px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        slideRightAndFade: {
          'from': {
            opacity: '0',
            transform: 'translateX(-2px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        slideUpAndFade: {
          'from': {
            opacity: '0',
            transform: 'translateY(2px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        }

      }
    },
  },
  plugins: [
    forms,
    aspectRatio
  ],
} satisfies Config;

