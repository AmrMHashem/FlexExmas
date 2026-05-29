// vite.config.js — FlexExams v5.0 Ultra Optimized Build
// ✅ History API SPA fallback (required for clean URLs /topics /exams etc.)
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },

  // ─────────────────────────────────────────────
  // DEV SERVER — SPA fallback مهم لـ History API
  // ─────────────────────────────────────────────
  server: {
    port: 3000,
    host: true,
    open: false,
    // Redirect all 404s to index.html so React handles routing
    historyApiFallback: true,
  },

  preview: {
    port: 4173,
    host: true,
  },

  // ─────────────────────────────────────────────
  // DEPENDENCY PRE-BUNDLING
  // ─────────────────────────────────────────────
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "firebase/app",
      "firebase/auth",
      "firebase/firestore",
    ],
    exclude: ["jspdf", "qrcode"],
  },

  // ─────────────────────────────────────────────
  // BUILD CONFIG
  // ─────────────────────────────────────────────
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    cssMinify: true,
    target: "es2020",
    assetsInlineLimit: 4096,

    chunkSizeWarningLimit: 600,
    reportCompressedSize: false,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("react")) return "react-vendor";
          if (id.includes("react-dom")) return "react-vendor";
          if (id.includes("firebase/app")) return "firebase-core";
          if (id.includes("firebase/auth")) return "firebase-auth";
          if (id.includes("firebase/firestore")) return "firebase-db";
          if (id.includes("firebase/storage")) return "firebase-storage";
          if (id.includes("framer-motion")) return "ui-anim";
          if (id.includes("react-icons")) return "ui-icons";
          if (id.includes("jspdf")) return "pdf";
          if (id.includes("qrcode")) return "qr";
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },
  },

  // ─────────────────────────────────────────────
  // ESBUILD OPTIMIZATION
  // ─────────────────────────────────────────────
  esbuild: {
    legalComments: "none",
  },
});