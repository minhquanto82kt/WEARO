import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url);
const provider = await readFile(new URL("src/lib/ai-provider.server.ts", root), "utf8");
const envExample = await readFile(new URL(".env.example", root), "utf8");
const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
const aiRoute = await readFile(new URL("src/routes/ai.tsx", root), "utf8");

assert.match(provider, /if \(provider === "replicate"\) return replicateProvider/);
assert.match(provider, /REPLICATE_API_TOKEN/);
assert.match(provider, /prunaai\/p-image-try-on/);
assert.match(provider, /person_image: images\[0\]/);
assert.match(provider, /garment_images: \[images\[1\]\]/);
assert.match(provider, /status !== "succeeded"/);
assert.match(provider, /20 \* 1024 \* 1024/);
assert.match(envExample, /AI_IMAGE_PROVIDER=openai/);
assert.match(envExample, /REPLICATE_API_TOKEN=/);
assert.match(envExample, /REPLICATE_TRYON_MODEL=prunaai\/p-image-try-on/);
assert.equal(packageJson.dependencies.replicate, undefined, "Replicate uses its HTTPS API directly; no SDK dependency is required.");

console.log("Replicate provider integration invariants: PASS");
