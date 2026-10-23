import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const sourceRoot = path.resolve("src");
const violations = [];
const warnings = [];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const secretPatterns = [
  { pattern: /\bSUPABASE_SERVICE_ROLE_KEY\b/, label: "Supabase service-role key name" },
  { pattern: /\bSUPABASE_SECRET_KEY\b/, label: "Supabase secret key name" },
  { pattern: /\bMOMO_SECRET_KEY\b/, label: "MoMo secret key name" },
  { pattern: /\bMASTERCARD_API_PASSWORD\b/, label: "Mastercard API password name" },
  { pattern: /\bREPLICATE_API_TOKEN\b/, label: "Replicate API token name" },
  { pattern: /\bOPENAI_API_KEY\b/, label: "OpenAI API key name" },
  { pattern: /\bSEPAY_WEBHOOK_SECRET\b/, label: "SePay webhook secret name" },
  { pattern: /\bVERCEL_ACCESS_TOKEN\b/, label: "Vercel access token name" },
  { pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, label: "private key material" },
];
const securityMarkers =
  /\b(?:auth|authorization|isAdmin|requireAdmin|verify\w*Signature|signature|CRON_SECRET|SUPABASE_SECRET_KEY|MOMO_SECRET_KEY|SEPAY_WEBHOOK_SECRET|accessToken|session|verifyWebhook|timingSafeEqual)\b/i;

function isServerOnly(relative) {
  return (
    relative.endsWith(".server.ts") ||
    relative.endsWith(".functions.ts") ||
    relative.includes("/routes/api/") ||
    relative.endsWith("/server.ts")
  );
}

async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    if (!extensions.has(path.extname(entry.name))) continue;
    const relative = path.relative(process.cwd(), full).replaceAll(path.sep, "/");
    const content = await readFile(full, "utf8");

    if (!isServerOnly(relative)) {
      for (const { pattern, label } of secretPatterns) {
        if (pattern.test(content)) {
          violations.push(`${relative}: ${label} referenced outside a server-only boundary.`);
        }
      }
    }

    if (relative.includes("/routes/api/")) {
      const sensitiveRoute = /(?:admin|payment|momo|sepay|internal|orders?|checkout|products?)/i.test(relative);
      if (sensitiveRoute && !securityMarkers.test(content)) {
        warnings.push(`${relative}: review authentication, authorization, signature verification, and replay protection manually.`);
      }
    }
  }
}

await walk(sourceRoot);

if (violations.length) {
  console.error("API security audit failed:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log("API security audit: no known server-secret identifiers or private-key markers found outside server-only boundaries.");
}

if (warnings.length) {
  console.warn(`Manual-review warnings (${warnings.length}); these are not automatic findings:`);
  for (const warning of warnings) console.warn(`- ${warning}`);
}
console.log("Scope: static heuristics only; this does not prove API authorization or webhook security.");
