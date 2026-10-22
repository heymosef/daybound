import { build } from "vite";
import { gzipSync } from "node:zlib";

const lazyMotion = process.argv.includes("--experiment-lazy-motion");
const result = await build({
  logLevel: "silent",
  plugins: lazyMotion ? [{
    name: "measure-lazy-motion-dom-max",
    enforce: "pre",
    transform(source, id) {
      if (!id.includes("/src/") || !id.endsWith(".tsx")) return;
      // In-memory experiment only. domMax is required to preserve layout/reorder features.
      let code = source.replace(/\bimport\s*\{([^}]+)\}\s*from\s*["']motion\/react["']/g,
        (_match, names) => `import {${names.replace(/\bmotion\b/, "m as motion")}} from "motion/react"`);
      if (id.endsWith("/src/main.tsx")) {
        code = `import { LazyMotion, domMax } from "motion/react";\n${code}`
          .replace("<React.StrictMode>", "<React.StrictMode><LazyMotion features={domMax}>")
          .replace("</React.StrictMode>", "</LazyMotion></React.StrictMode>");
      }
      return code;
    },
  }] : [],
  build: { write: false, reportCompressedSize: false },
});
const outputs = (Array.isArray(result) ? result : [result]).flatMap((item) => item.output);
const assets = outputs.map((item) => {
  const data = item.type === "chunk" ? Buffer.from(item.code) : Buffer.from(item.source);
  return { file: item.fileName, bytes: data.length, gzipBytes: gzipSync(data).length };
});
const totals = (suffix) => assets.filter((asset) => asset.file.endsWith(suffix)).reduce(
  (sum, asset) => ({ bytes: sum.bytes + asset.bytes, gzipBytes: sum.gzipBytes + asset.gzipBytes }), { bytes: 0, gzipBytes: 0 });
console.log(JSON.stringify({ node: process.version, experiment: lazyMotion ? "LazyMotion/domMax" : "current", js: totals(".js"), css: totals(".css"), assets }, null, 2));
