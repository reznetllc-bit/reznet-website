import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const expected = Object.freeze({
  siteId: "c662787c-d2df-4eae-8c80-0b2301f670bd",
  clientId: "f4d3315e-bf52-401b-9632-2f528268ee3b",
  formId: "abfab16b-5544-490a-b726-487924a7c964",
  triggeredEmailId: "VU7gXuR"
});

const wixConfig = JSON.parse(
  await readFile(path.join(repositoryRoot, "wix.config.json"), "utf8")
);

if (wixConfig.projectType !== "Site") {
  throw new Error(`Expected projectType Site, found ${wixConfig.projectType}.`);
}
if (wixConfig.siteId !== expected.siteId) {
  throw new Error(`Wrong Wix production site: ${wixConfig.siteId}.`);
}
if (wixConfig.appId !== expected.clientId) {
  throw new Error(`Wrong Wix Headless client: ${wixConfig.appId}.`);
}
if (wixConfig.site?.outputDirectory !== "./site") {
  throw new Error(`Wrong production output directory: ${wixConfig.site?.outputDirectory}.`);
}

const browserConfig = await readFile(
  path.join(repositoryRoot, "site", "assets", "js", "wix-config.js"),
  "utf8"
);

for (const [key, value] of Object.entries(expected)) {
  if (!browserConfig.includes(value)) {
    throw new Error(`Production browser config is missing ${key}: ${value}.`);
  }
}

const frontendSource = await readFile(
  path.join(repositoryRoot, "frontend-src", "reznet.js"),
  "utf8"
);

if (!frontendSource.includes("@wix/site-crm")) {
  throw new Error("RezNet frontend source is missing the Wix Triggered Emails SDK import.");
}

if (!/emailContact\s*\(\s*config\.triggeredEmailId\s*,\s*contactId\s*\)/.test(frontendSource)) {
  throw new Error("RezNet frontend source is not wired to the configured Triggered Email ID.");
}

const bundlePath = path.join(repositoryRoot, "site", "assets", "js", "reznet.js");
const bundle = await readFile(bundlePath);
const bundleText = bundle.toString("utf8");

// The exact Triggered Email ID lives in wix-config.js and is read at runtime.
// The minified bundle must contain the delivery path, not a duplicated hard-coded ID.
for (const requiredText of [
  "triggeredEmailId",
  "emailContact",
  "form-submission-service/v4/submissions"
]) {
  if (!bundleText.includes(requiredText)) {
    throw new Error(`Production bundle is missing required marker: ${requiredText}.`);
  }
}

const manifestText = await readFile(
  path.join(repositoryRoot, "PRODUCTION_SHA256SUMS.txt"),
  "utf8"
);
const bundleHash = createHash("sha256").update(bundle).digest("hex");
const expectedManifestLine = `${bundleHash}  site/assets/js/reznet.js`;

if (!manifestText.split(/\r?\n/).includes(expectedManifestLine)) {
  throw new Error("Production checksum manifest does not match the current RezNet JavaScript bundle.");
}

console.log("RezNet production verification PASS.");
console.log(`Site: ${expected.siteId}`);
console.log(`Form: ${expected.formId}`);
console.log(`Triggered Email: ${expected.triggeredEmailId}`);
console.log(`Bundle SHA-256: ${bundleHash}`);
