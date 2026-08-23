/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
    },
    extend: {
      // 品牌主色系：基于现有强调色 #00d9ff 青色，提供完整色阶用于统一强调
      colors: {
        brand: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#00d9ff",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
      },
      // 字体令牌：替代行内 font-['Syne'] / font-['DM Sans'] 写法
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ['"DM Sans"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      // 发光阴影令牌：统一卡片/按钮的辉光效果
      boxShadow: {
        glow: "0 0 30px rgba(0, 217, 255, 0.3)",
        "glow-sm": "0 0 20px rgba(0, 217, 255, 0.15)",
        card: "0 20px 60px rgba(0, 217, 255, 0.08), 0 8px 24px rgba(0, 0, 0, 0.3)",
      },
      // 统一动画令牌（与 index.css keyframes 配合）
      animation: {
        float: "float 5s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "spin-slow": "spin-slow 16s linear infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      // 常用渐变令牌
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #00d9ff 0%, #6366f1 100%)",
        "gradient-text": "linear-gradient(135deg, #00d9ff 0%, #a78bfa 50%, #e94560 100%)",
      },
    },
  },
  plugins: [],
};
