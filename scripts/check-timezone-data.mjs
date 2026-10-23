// Read-only maintenance check. Normal installs/builds use the lockfile and require no IANA network call.
import data from "../src/utils/timezoneAliases.json" with { type: "json" };
import aliasSource from "tzdata/timezone-data.json" with { type: "json" };
if (aliasSource.version !== data.version) throw new Error("Regenerate alias metadata with npm run tz:aliases.");
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const provider = await readFile(require.resolve("@js-joda/timezone"), "utf8");
const providerVersion = provider.match(/@js-joda\/timezone - [\d.]+-(\d{4}[a-z]+)/)?.[1];
if (providerVersion !== data.version) throw new Error(`Provider ${providerVersion} and alias metadata ${data.version} do not match; update both.`);
const response = await fetch("https://data.iana.org/time-zones/tzdb/version", { signal: AbortSignal.timeout(15000) });
if (!response.ok) throw new Error(`IANA version check failed: ${response.status}`);
const latest = (await response.text()).trim();
if (!/^\d{4}[a-z]+$/.test(latest)) throw new Error("Unexpected IANA version response");
console.log(`Bundled IANA ${data.version}; current IANA ${latest}`);
if (data.version !== latest) {
  console.error("Update the pinned timezone provider and tzdata metadata dependencies and lockfile, review release notes, then run timezone and full verification checks. See docs/timezone-data.md.");
  process.exitCode = 1;
}
