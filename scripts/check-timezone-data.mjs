// Read-only maintenance check. Normal installs/builds use the lockfile and require no IANA network call.
import { appendFile, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { checkTimezoneData, timezoneCheckSummary } from "./lib/timezone-check.mjs";

const require = createRequire(import.meta.url);
let result;
try {
  const [metadata, source, provider] = await Promise.all([
    readFile(new URL("../src/utils/timezoneAliases.json", import.meta.url), "utf8"),
    readFile(require.resolve("tzdata/timezone-data.json"), "utf8"),
    readFile(require.resolve("@js-joda/timezone"), "utf8"),
  ]);
  result = await checkTimezoneData({
    metadataVersion: JSON.parse(metadata).version,
    sourceVersion: JSON.parse(source).version,
    providerVersion: provider.match(/@js-joda\/timezone - [\d.]+-(\d{4}[a-z]+)/)?.[1],
  });
} catch {
  result = {
    exitCode: 1,
    heading: "Timezone review needed",
    message: "Pinned timezone data could not be read. Run npm ci and review provider/source/generated metadata; see docs/timezone-data.md.",
  };
}

const log = result.exitCode === 0 ? console.log : console.error;
log(`${result.heading}: ${result.message}`);
process.exitCode = result.exitCode;
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, timezoneCheckSummary(result));
}
