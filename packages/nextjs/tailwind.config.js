/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./utils/**/*.{js,ts,jsx,tsx}"],
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [],
  theme: {
    extend: {
      colors: {
        "gray-700": "var(--gray-700)",
        "gray-500": "var(--gray-500)",
        "gray-600": "var(--gray-600)",

        "brand-purple": "var(--brand-purple)",
        "brand-green": "var(--brand-green)",
        "brand-pink": "var(--brand-pink)",
        "brand-pink-dark": "var(--brand-pink-dark)",
        "brand-orange": "var(--brand-orange)",
        "brand-cyan": "var(--brand-cyan)",
        "brand-yellow": "var(--brand-yellow)",
        "brand-lime": "var(--brand-lime)",
        "brand-red": "var(--brand-red)",
        highlighted: "var(--highlighted)",
        "dark-brown": "var(--dark-brown)",
        border: "var(--border)",

        "white-100": "var(--white-100)",
        "white-200": "var(--white-200)",
        "white-400": "var(--white-400)",
        "btn-secondary": "var(--btn-secondary)",
        success: "var(--success)",

        background: "var(--bg-primary)",
        foreground: "var(--foreground)",
        primary: "var(--bg-primary)",
        secondary: "var(--bg-secondary)",
      },
      boxShadow: {
        center: "0 0 12px -2px rgb(0 0 0 / 0.05)",
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
};
