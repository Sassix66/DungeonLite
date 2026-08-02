import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entryFile = resolve(projectRoot, "js/main.js");
const importPattern = /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g;

function javascriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory()
      ? javascriptFiles(path)
      : extname(entry.name) === ".js" ? [path] : [];
  });
}

const allFiles = javascriptFiles(resolve(projectRoot, "js"));
const reachable = new Set();
const errors = [];

function visit(file) {
  if (reachable.has(file)) return;
  reachable.add(file);

  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    if (!specifier.startsWith(".")) continue;

    const dependency = resolve(dirname(file), specifier);
    if (!existsSync(dependency)) {
      errors.push(`${relative(projectRoot, file)}: ${specifier}`);
      continue;
    }

    visit(dependency);
  }
}

visit(entryFile);

const unused = allFiles.filter(file => !reachable.has(file));

if (errors.length || unused.length) {
  if (errors.length) {
    console.error("Fehlende lokale Imports:");
    errors.forEach(error => console.error(`- ${error}`));
  }
  if (unused.length) {
    console.error("Nicht vom Einstiegspunkt erreichbare Module:");
    unused.forEach(file => console.error(`- ${relative(projectRoot, file)}`));
  }
  process.exitCode = 1;
} else {
  console.log(`Importprüfung erfolgreich: ${reachable.size} Module erreichbar.`);
}
