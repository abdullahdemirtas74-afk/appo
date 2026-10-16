#!/usr/bin/env node
/**
 * Copies web PWA icons into mobile/resources for store / native icon use.
 * Run from mobile/: npm run assets
 */
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const webIcons = join(root, "..", "web", "public", "icons");
const out = join(root, "resources");

mkdirSync(out, { recursive: true });

const copies = [
  ["icon-512.png", "icon.png"],
  ["icon-512.png", "icon-foreground.png"],
  ["icon-192.png", "icon-192.png"],
];

for (const [srcName, destName] of copies) {
  const src = join(webIcons, srcName);
  const dest = join(out, destName);
  if (!existsSync(src)) {
    console.warn(`skip missing ${src}`);
    continue;
  }
  copyFileSync(src, dest);
  console.log(`copied ${srcName} → resources/${destName}`);
}

console.log("Done. Use resources/icon.png (1024×1024 preferred) for store listings.");
