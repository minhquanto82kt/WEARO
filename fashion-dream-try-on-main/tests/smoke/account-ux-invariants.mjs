import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../../", import.meta.url).pathname;
const read = (file) => readFile(join(root, file), "utf8");
const [account, styles] = await Promise.all([
  read("src/routes/account.tsx"),
  read("src/routes/account.scss"),
]);

function check(condition, label) {
  assert.ok(condition, label);
  console.log(`PASS ${label}`);
}

// One stylesheet owns the account route's visual system.
check(account.includes('import "./account.scss";'), "account route imports its dedicated stylesheet");
check(!account.includes("<style>"), "route has no embedded style block");
check(!/style=\{\{/.test(account), "route has no inline style overrides");
check(styles.includes("--account-blue: #54728c") && styles.includes("--account-peach: #f2ad94"), "brand colors are defined as account design tokens");
check(styles.includes(".account-page") && styles.includes("@media (max-width: 560px)"), "styles are namespaced and include mobile layout");
check(styles.includes("prefers-reduced-motion"), "motion respects reduced-motion preferences");

// Keep a single canonical form and clear, mutually exclusive auth states.
check((account.match(/className="account-form"/g) || []).length === 1, "login, register, recover and reset share one form");
check((account.match(/role="tablist"/g) || []).length === 1, "login/register switch is rendered once");
check(account.includes('mode === "login" || mode === "register"') && account.includes('mode === "recover"') && account.includes('mode === "reset"'), "all auth states remain explicit");
check(account.includes("await signInCustomer(normalizedEmail, password)"), "signup with an immediate session uses the shared sign-in path");
check(account.includes("setRequiresEmailConfirmation(true)"), "signup without a session offers email confirmation");
check(account.includes("const onAuth = () => { setCheckingUser(true); void loadUser(); };"), "one auth event refreshes session state and gates the transition");
check(!account.includes("await loadUser()"), "login and registration do not trigger duplicate session fetches");
check(account.includes('className="account-hub-grid"') && account.includes('className="account-auth-grid"'), "signed-out auth and signed-in hub have separate layout roots");
check(account.includes("upthink:auth:login") && account.includes("upthink:auth:logout") && account.includes("upthink:auth:recovery"), "auth events keep the account view in sync");

console.log("ACCOUNT UX CONTRACT PASS");
