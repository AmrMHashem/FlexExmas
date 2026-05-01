// vite.config.js — FlexExams v5.0 Ultra Optimized Build
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
  // DEV SERVER
  // ─────────────────────────────────────────────
  server: {
    port: 3000,
    host: true,
    open: false,
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
        // ─────────────────────────────
        // SMART CHUNK SPLITTING
        // ─────────────────────────────
        manualChunks(id) {
          // React core
          if (id.includes("react")) return "react-vendor";
          if (id.includes("react-dom")) return "react-vendor";

          // Firebase (split but not over fragmented)
          if (id.includes("firebase/app")) return "firebase-core";
          if (id.includes("firebase/auth")) return "firebase-auth";
          if (id.includes("firebase/firestore")) return "firebase-db";
          if (id.includes("firebase/storage")) return "firebase-storage";

          // UI / Animation libs
          if (id.includes("framer-motion")) return "ui-anim";
          if (id.includes("react-icons")) return "ui-icons";

          // Heavy lazy features
          if (id.includes("jspdf")) return "pdf";
          if (id.includes("qrcode")) return "qr";
        },

        // ─────────────────────────────
        // FILE NAMING (CACHE OPTIMIZED)
        // ─────────────────────────────
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
