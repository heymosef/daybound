import data from "tzdata/timezone-data.json" with { type: "json" };
import { writeFile } from "node:fs/promises";
const aliases = Object.fromEntries(Object.entries(data.zones).filter(([, value]) => typeof value === "string"));
await writeFile(new URL("../src/utils/timezoneAliases.json", import.meta.url), JSON.stringify({ version: data.version, names: Object.keys(data.zones).sort(), aliases }) + "\n");
console.log(`Generated IANA ${data.version} names and aliases (no offset rules).`);
