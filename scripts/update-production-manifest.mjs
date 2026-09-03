import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = path.join(repositoryRoot, "site");
const outputPath = path.join(repositoryRoot, "PRODUCTION_SHA256SUMS.txt");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === ".DS_Store") continue;
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(absolutePath));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

const files = (await walk(siteRoot)).sort((a, b) => a.localeCompare(b));
const lines = [];

for (const file of files) {
  const bytes = await readFile(file);
  const hash = createHash("sha256").update(bytes).digest("hex");
  const relative = path.posix.join(
    "site",
    path.relative(siteRoot, file).split(path.sep).join("/")
  );
  lines.push(`${hash}  ${relative}`);
}

await writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Updated ${path.relative(repositoryRoot, outputPath)} for ${lines.length} production files.`);
