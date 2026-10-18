import { spawn } from "node:child_process";

const commands = [
  ["phase-b-c", "tests/smoke/phase-b-c-invariants.mjs"],
  ["phase-d-e", "tests/smoke/phase-d-e-invariants.mjs"],
  ["phase-f-security", "tests/security/phase-f-security.mjs"],
];

// These suites only read source files and issue read-only requests, except for
// unauthenticated POST requests that are expected to be rejected with 401.
// They do not create or mutate shared application/database state, so they can
// safely run concurrently against the same CI server.
function runGate(label, script) {
  return new Promise((resolve) => {
    console.log(`\n=== CUSTOMER GATE: ${label} ===`);
    const child = spawn(process.execPath, [script], {
      stdio: "inherit",
      env: process.env,
    });

    child.once("error", (error) => {
      console.error(`FAIL customer gate: ${label} (${error.message})`);
      resolve(false);
    });
    child.once("close", (code, signal) => {
      if (code === 0) {
        console.log(`PASS customer gate: ${label}`);
        resolve(true);
      } else {
        console.error(`FAIL customer gate: ${label} (exit ${code ?? signal ?? "unknown"})`);
        resolve(false);
      }
    });
  });
}

const results = await Promise.all(commands.map(([label, script]) => runGate(label, script)));
if (results.some((passed) => !passed)) process.exit(1);
console.log("\nCustomer Experience Validation: PASS");
