#!/usr/bin/env node
// Development-time utility (NOT part of the runtime app).
// Scans public/photos and rewrites public/photos/manifest.json.
import { readdirSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "public", "photos");
const ok = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const photos = readdirSync(dir, { withFileTypes: true })
  .filter((d) => d.isFile() && ok.has(extname(d.name).toLowerCase()))
  .map((d) => d.name)
  .sort((a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }));

writeFileSync(join(dir, "manifest.json"), JSON.stringify({ photos }, null, 2) + "\n");
console.log(`photos/manifest.json updated — ${photos.length} photo(s).`);
photos.forEach((p) => console.log("  •", p));
