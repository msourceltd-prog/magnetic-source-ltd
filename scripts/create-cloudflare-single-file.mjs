import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const publicDir = path.join(projectRoot, "dist", "public");
const outputDir = "/home/ubuntu/Downloads/magnetic-source-cloudflare-single";
const outputFile = path.join(outputDir, "index.html");

const html = await readFile(path.join(publicDir, "index.html"), "utf8");
const cssMatch = html.match(/<link[^>]+href="(\/assets\/[^"?]+\.css)"[^>]*>/);
const jsMatch = html.match(/<script[^>]+src="(\/assets\/[^"?]+\.js)"[^>]*><\/script>/);
if (!cssMatch || !jsMatch) throw new Error("The production index.html does not contain expected CSS and JavaScript asset references.");

const css = await readFile(path.join(publicDir, cssMatch[1].slice(1)), "utf8");
const js = await readFile(path.join(publicDir, jsMatch[1].slice(1)), "utf8");
const encodedModule = Buffer.from(js).toString("base64");
const moduleBootstrap = `<script type="module">
const source = atob("${encodedModule}");
const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
import(moduleUrl);
</script>`;

const inlineHtml = html
  .replace(/<link[^>]+href="\/assets\/[^"?]+\.css"[^>]*>/g, "")
  .replace(/<script[^>]+src="\/assets\/[^"?]+\.js"[^>]*><\/script>/g, "")
  .replace(/<link[^>]+rel="icon"[^>]*>/g, "")
  .replace("</head>", `<style>\n${css}\n</style>\n</head>`)
  .replace("</body>", `${moduleBootstrap}\n</body>`);

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await writeFile(outputFile, inlineHtml);
console.log(JSON.stringify({ outputFile, bytes: Buffer.byteLength(inlineHtml), cssAsset: cssMatch[1], jsAsset: jsMatch[1] }, null, 2));
