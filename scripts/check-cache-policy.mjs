import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const policyPaths = [
  resolve("public", ".htaccess"),
  resolve("dist", ".htaccess"),
];
const immutableAssetPattern =
  "^[^/]+-[A-Za-z0-9_-]{8,}\\.(?:js|css|woff2|svg|png|jpe?g|gif|webp|ico)$";
const stableAssetPattern =
  "^(?:index\\.html|manifest\\.webmanifest|sw\\.js|favicon\\.svg|icon-192\\.png|icon-512\\.png)$";
const immutableFilename = /^[^/]+-[A-Za-z0-9_-]{8,}\.(?:js|css|woff2|svg|png|jpe?g|gif|webp|ico)$/;
const stableFilename = /^(?:index\.html|manifest\.webmanifest|sw\.js|favicon\.svg|icon-192\.png|icon-512\.png)$/;
const policies = policyPaths.map((path) => [path, readFileSync(path, "utf8")]);
const generatedAssets = readdirSync(resolve("dist", "assets"), { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter((filename) => /.(?:js|css|woff2|svg|png|jpe?g|gif|webp|ico)$/.test(filename));

assert.equal(
  policies[1][1],
  policies[0][1],
  "Vite must copy public/.htaccess into dist/.htaccess",
);

for (const [path, policy] of policies) {
  const assetRule = policy.indexOf(immutableAssetPattern);
  const shellRule = policy.indexOf(stableAssetPattern);

  assert.ok(policy.includes("<IfModule mod_headers.c>"), `${path} must guard mod_headers`);
  assert.match(policy, /AddType application\/manifest\+json \.webmanifest/);
  assert.ok(assetRule >= 0, `${path} must target fingerprinted assets only`);
  assert.ok(shellRule >= 0, `${path} must explicitly revalidate stable files`);
  assert.ok(shellRule > assetRule, `${path} stable-file rules must follow asset rules`);
  assert.match(policy, /Header always set Cache-Control "public, max-age=31536000, immutable"/);
  assert.match(policy, /Header always set Cache-Control "no-cache, no-store, must-revalidate"/);
  assert.match(policy, /Header always set Pragma "no-cache"/);
  assert.match(policy, /Header always set Expires "0"/);
}

assert.ok(generatedAssets.length > 0, "the build must emit cacheable assets");
for (const filename of generatedAssets) {
  assert.match(filename, immutableFilename, `${filename} must use a fingerprinted filename`);
}
assert.match("index-Bwk48bTV.js", immutableFilename);
assert.match("_v-CW0R2FO_.js", immutableFilename);
assert.match("_v-CjLrUSL-.js", immutableFilename);
assert.doesNotMatch("favicon.svg", immutableFilename);
assert.doesNotMatch("index.html", immutableFilename);
for (const filename of ["index.html", "manifest.webmanifest", "sw.js", "favicon.svg", "icon-192.png", "icon-512.png"]) {
  assert.match(filename, stableFilename);
}

console.log("Static-host cache policy checks passed");
