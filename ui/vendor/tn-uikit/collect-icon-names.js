const fs = require("fs");

const spritePath = "./components/icons/sprite/sprite.vue";
const defaultIconsPath = "./components/icons/default-icons.ts";
const symbolRegexp = /<symbol[^>]*\sid="icon--([^"]+)"/g;

let sprite = "";

try {
  sprite = fs.readFileSync(spritePath, "utf8");
} catch (error) {
  console.error(`Could not read ${spritePath}: ${error.message}`);
  process.exit(1);
}

const names = [];

for (const match of sprite.matchAll(symbolRegexp)) {
  if (!names.includes(match[1])) {
    names.push(match[1]);
  }
}

if (!names.length) {
  console.error(`No icons found in ${spritePath}, ${defaultIconsPath} left untouched`);
  process.exit(1);
}

const content = `export const DefaultIconNames = [\n${names.map(name => `  "${name}"`).join(",\n")}\n] as const;\n`;

if (fs.existsSync(defaultIconsPath) && fs.readFileSync(defaultIconsPath, "utf8") === content) {
  console.log(`Icon names are up to date: ${names.length}`);
} else {
  fs.writeFileSync(defaultIconsPath, content);
  console.log(`Icon names collected: ${names.length}`);
}
