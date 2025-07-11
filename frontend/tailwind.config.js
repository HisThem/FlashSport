import daisyui from "daisyui"; // 引入 daisyui
/** @type {import('tailwindcss').Config} */
export default {
  // 👇 告诉 Tailwind 去哪里扫描你的类名
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 适用于 React, Vue, Svelte 等
  ],
  theme: {
    extend: {},
  },
  // 👇 添加 daisyui 插件
  plugins: [daisyui],
  // 👇 添加 daisyui 的主题配置
  daisyui: {
    themes: ["light", "dark"], // 启用 light 和 dark 主题
    darkTheme: "dark", // 暗黑模式默认使用 "dark" 主题
  },
}