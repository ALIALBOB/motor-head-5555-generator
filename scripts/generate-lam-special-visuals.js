const fs = require("fs");
const path = require("path");

const root = process.cwd();
const palettePath = path.join(root, "config", "lam_special_backgrounds.json");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizePalette(palette) {
  const backgrounds = palette.backgrounds || [];
  return {
    schemaVersion: 1,
    purpose: "Reusable background and material color palette kept after removing the rejected 40 special-machine visual pass. Use these colors later when randomizing normal Motorheads traits.",
    source: "retained-material-background-colors",
    count: backgrounds.length,
    backgrounds: backgrounds.map((entry, index) => ({
      index: index + 1,
      id: entry.id,
      label: entry.label,
      surface: entry.surface,
      background: entry.background,
      primary: entry.primary,
      secondary: entry.secondary,
      accent: entry.accent,
      edge: entry.edge,
      glow: entry.glow,
      liquidType: entry.liquidType,
      liquidTexture: entry.liquidTexture,
      notes: entry.notes,
      randomizerTags: Array.isArray(entry.randomizerTags)
        ? entry.randomizerTags
        : [entry.surface, entry.liquidTexture, entry.label].filter(Boolean)
    }))
  };
}

function main() {
  if (!fs.existsSync(palettePath)) {
    throw new Error("config/lam_special_backgrounds.json is missing");
  }

  const palette = normalizePalette(readJson(palettePath));
  if (!palette.backgrounds.length) {
    throw new Error("config/lam_special_backgrounds.json has no background entries");
  }

  writeJson(palettePath, palette);
  console.log("special machine visual generation disabled");
  console.log(`kept ${palette.backgrounds.length} background/material color sets in config/lam_special_backgrounds.json`);
}

if (require.main === module) main();

module.exports = { main, normalizePalette };
