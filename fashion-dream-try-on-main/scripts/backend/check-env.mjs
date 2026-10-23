import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const examplePath = path.join(root, ".env.example");
const profileArg = process.argv.find((arg) => arg.startsWith("--profile="));
const profile = profileArg?.split("=")[1] ?? "ci";

const profiles = {
  ci: ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"],
  preview: ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"],
  production: [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
    "CRON_SECRET",
  ],
};

if (!Object.hasOwn(profiles, profile)) {
  console.error(`Unknown profile "${profile}". Use ci, preview, or production.`);
  process.exit(2);
}

const secretNamePattern =
  /(?:SECRET|PRIVATE|PASSWORD|ACCESS_TOKEN|API_KEY|SERVICE_ROLE|WEBHOOK_SECRET|SUPABASE_SECRET|REPLICATE_API_TOKEN|OPENAI_API_KEY|VERCEL_ACCESS_TOKEN)/i;
const errors = [];
const warnings = [];
const example = await readFile(examplePath, "utf8");
const documentedNames = new Set(
  [...example.matchAll(/^\s*([A-Z][A-Z0-9_]*)\s*=/gm)].map((match) => match[1]),
);

for (const name of documentedNames) {
  if (name.startsWith("VITE_") && secretNamePattern.test(name)) {
    errors.push(`${name} looks secret and must not use the VITE_ client prefix.`);
  }
}

for (const name of profiles[profile]) {
  if (!process.env[name]?.trim()) errors.push(`Required variable is missing: ${name}`);
}

for (const name of documentedNames) {
  if (secretNamePattern.test(name) && process.env[name]?.trim()) {
    // Deliberately never print values. This only confirms presence.
    continue;
  }
}

if (profile === "production") {
  const provider = (process.env.AI_IMAGE_PROVIDER ?? "openai").toLowerCase();
  if (provider === "replicate" && !process.env.REPLICATE_API_TOKEN?.trim()) {
    errors.push("REPLICATE_API_TOKEN is required when AI_IMAGE_PROVIDER=replicate.");
  }
  if (process.env.MOMO_PARTNER_CODE && !process.env.MOMO_ACCESS_KEY?.trim()) {
    errors.push("MOMO_ACCESS_KEY is required when MoMo credentials are partially configured.");
  }
  if (process.env.MOMO_PARTNER_CODE && !process.env.MOMO_SECRET_KEY?.trim()) {
    errors.push("MOMO_SECRET_KEY is required when MoMo credentials are partially configured.");
  }
}

if (errors.length) {
  console.error(`Environment check failed (profile: ${profile}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Environment check passed (profile: ${profile}); values were not printed.`);
}
if (warnings.length) for (const warning of warnings) console.warn(`WARN ${warning}`);
