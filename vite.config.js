import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Une build portable sous un sous-dossier (GitHub Pages, prévisualisation statique).
  base: "./",
});
