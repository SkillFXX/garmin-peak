import esbuild from "esbuild";
import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("dist", { recursive: true });

await esbuild.build({
  entryPoints: {
    content: "src/content.js",
    background: "src/background.js",
  },
  bundle: true,
  outdir: "dist",
  platform: "browser",
  target: ["chrome114"],
  format: "iife",
  minify: true,
  sourcemap: false,
  splitting: false,
  metafile: true,
});

copyFileSync("manifest.json", "dist/manifest.json");
