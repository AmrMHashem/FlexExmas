// vite.config.js — FlexExams v4.4 (Optimized Production Build)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react()
  ],

  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },

  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    target: "es2020",
    cssMinify: true,
    assetsInlineLimit: 4096,

    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core (stable split)
          if (id.includes("react-dom")) return "react-dom";
          if (id.includes("react")) return "react";

          // Firebase (single chunk أفضل للاستقرار)
          if (id.includes("firebase")) return "firebase";

          // UI libs
          if (id.includes("framer-motion")) return "framer-motion";
          if (id.includes("react-icons")) return "react-icons";

          // Heavy lazy features
          if (id.includes("jspdf")) return "pdf";
          if (id.includes("qrcode")) return "qrcode";
        },

        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },

    chunkSizeWarningLimit: 800,
    reportCompressedSize: false,
  },

  server: {
    port: 3000,
    host: true,
  },

  preview: {
    port: 4173,
    host: true,
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "firebase/app"
    ],
    exclude: [
      "jspdf",
      "qrcode"
    ],
  },

  esbuild: {
    legalComments: "none",
    // 👇 safer option (no log stripping by default)
    // drop: process.env.NODE_ENV === "production" ? ["debugger"] : []
  },
});