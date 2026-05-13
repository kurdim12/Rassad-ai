/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        arabic: ["Noto Kufi Arabic", "Tajawal", "system-ui", "sans-serif"],
        display: ["Cairo", "Noto Kufi Arabic", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9ecff",
          200: "#bcdfff",
          300: "#8ecbff",
          400: "#58aeff",
          500: "#2f8cff",
          600: "#1a6df0",
          700: "#1657d4",
          800: "#1748a8",
          900: "#1a4287",
          950: "#142a5c",
        },
        verdict: {
          true: "#10b981",
          false: "#ef4444",
          mid: "#f59e0b",
          unk: "#64748b",
          ai: "#8b5cf6",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "mesh": "radial-gradient(at 0% 0%, #1657d4 0%, transparent 50%), radial-gradient(at 100% 100%, #8b5cf6 0%, transparent 50%)",
      },
    },
  },
  plugins: [],
};
