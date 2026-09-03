import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const expected = Object.freeze({
  siteId: "c662787c-d2df-4eae-8c80-0b2301f670bd",
  clientId: "f4d3315e-bf52-401b-9632-2f528268ee3b",
  formId: "abfab16b-5544-490a-b726-487924a7c964"
});

const structuredTargets = Object.freeze([
  "city_zip_372e",
  "role_a6e4",
  "property_stage_6098",
  "primary_concern_10c4",
  "square_footage_f1c8",
  "timeline_4a55",
  "contact_permission_53dc"
]);

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

for (const target of structuredTargets) {
  if (!browserConfig.includes(target)) {
    throw new Error(`Production browser config is missing structured intake target: ${target}.`);
  }
}

for (const obsoleteMarker of ["triggeredEmailId", "VU7gXuR"]) {
  if (browserConfig.includes(obsoleteMarker)) {
    throw new Error(`Production browser config still contains obsolete customer-receipt marker: ${obsoleteMarker}.`);
  }
}

const frontendSource = await readFile(
  path.join(repositoryRoot, "frontend-src", "reznet.js"),
  "utf8"
);

for (const obsoleteMarker of ["@wix/site-crm", "triggeredEmails", "emailContact", "sendAssessmentAcknowledgment"]) {
  if (frontendSource.includes(obsoleteMarker)) {
    throw new Error(`RezNet frontend source still contains obsolete Triggered Email code: ${obsoleteMarker}.`);
  }
}

if (!frontendSource.includes("form-submission-service/v4/submissions")) {
  throw new Error("RezNet frontend source is missing the Wix Forms submission endpoint.");
}

for (const binding of [
  "targets.cityZip",
  "targets.role",
  "targets.propertyStage",
  "targets.primaryConcern",
  "targets.squareFootage",
  "targets.timeline",
  "targets.contactPermission"
]) {
  if (!frontendSource.includes(binding)) {
    throw new Error(`RezNet frontend source is missing structured intake binding: ${binding}.`);
  }
}

const bundlePath = path.join(repositoryRoot, "site", "assets", "js", "reznet.js");
const bundle = await readFile(bundlePath);
const bundleText = bundle.toString("utf8");

if (!bundleText.includes("form-submission-service/v4/submissions")) {
  throw new Error("Production bundle is missing the Wix Forms submission path.");
}

for (const obsoleteMarker of ["triggeredEmailId", "emailContact", "VU7gXuR"]) {
  if (bundleText.includes(obsoleteMarker)) {
    throw new Error(`Production bundle still contains obsolete customer-receipt marker: ${obsoleteMarker}.`);
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
console.log("Customer receipt: Wix native Form submitted automation");
console.log(`Structured intake fields: ${structuredTargets.length}`);
console.log(`Bundle SHA-256: ${bundleHash}`);
