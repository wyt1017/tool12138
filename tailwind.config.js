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
      // 颜色全部映射到 index.css 的主题令牌，保证深浅色主题一致
      colors: {
        brand: {
          DEFAULT: "var(--brand)",
          soft: "var(--brand-soft)",
          text: "var(--brand-text)",
          glow: "var(--brand-glow)",
          "glow-soft": "var(--brand-glow-soft)",
        },
        violet: { DEFAULT: "var(--violet)", glow: "var(--violet-glow)" },
        bg: {
          DEFAULT: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          card: "var(--bg-card)",
          "card-solid": "var(--bg-card-solid)",
          elevated: "var(--bg-elevated)",
          hover: "var(--bg-hover)",
        },
        border: {
          DEFAULT: "var(--border-color)",
          strong: "var(--border-strong)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)",
        },
        danger: "var(--danger)",
        success: "var(--success)",
        warn: "var(--warn)",
      },
      // 字体令牌
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ['"DM Sans"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      // 发光/卡片阴影令牌
      boxShadow: {
        glow: "0 0 30px var(--brand-glow)",
        "glow-sm": "0 0 20px var(--brand-glow-soft)",
        card: "0 20px 60px color-mix(in srgb, var(--brand) 16%, transparent), 0 8px 24px rgba(11, 26, 48, 0.14)",
        "md": "var(--shadow-md)",
        "lg": "var(--shadow-lg)",
      },
      // 动画令牌
      animation: {
        float: "float 5s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        aurora: "aurora-shift 18s ease-in-out infinite",
        "spin-slow": "spin-slow 16s linear infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
      },
      keyframes: {
        "aurora-shift": {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(6%,-5%) scale(1.06)" },
        },
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
      // 渐变令牌
      backgroundImage: {
        "gradient-brand": "var(--gradient-brand)",
        "gradient-rich": "var(--gradient-rich)",
      },
      // 应用级缓动
      transitionTimingFunction: {
        app: "var(--ease-app)",
      },
    },
  },
  plugins: [],
};