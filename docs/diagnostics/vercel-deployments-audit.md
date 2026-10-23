# Vercel Deployment Snapshot Audit

> **Purpose:** historical troubleshooting note based on a local `deployments.json` export.
>
> **Important:** this is a snapshot, not live Vercel state. The entries below were last observed in the supplied export (September 2026). Re-check the Vercel dashboard or CLI before making deployment decisions.

## Snapshot summary

- Vercel context in the export: `up-think`
- Deployments included: **20**
- `READY`: **8**
- `ERROR`: **1**
- `CANCELED`: **11**

A canceled deployment is not, by itself, evidence of a code/build failure. An `ERROR` status also does not identify the root cause without its build/runtime logs.

## Highest-priority historical failure

- Branch: `feature/product-admin`
- Commit: `34ff047c40d30dca1838f61006a1fc1a2ac2d0a0`
- Commit message: `test: repair Phase E/F static gate workspace paths`
- Deployment: [fashion-dream-try-on-main-50ekceprv-up-think.vercel.app](https://fashion-dream-try-on-main-50ekceprv-up-think.vercel.app)
- Snapshot timestamp: `2026-09-18T22:35:59.447Z`
- Recorded status: `ERROR`

The export does **not** include enough diagnostic evidence to attribute the failure to a specific source file, dependency, environment variable, test, or Vercel configuration. Do not treat the commit message as the root cause.

## Nearby successful deployment in the same export

- Commit: `06637ef0443b74cebf0010306c64357c3df2c8b0`
- Commit message: `test(security): add Phase F security smoke checks`
- Deployment: [fashion-dream-try-on-main-91vbpo24d-up-think.vercel.app](https://fashion-dream-try-on-main-91vbpo24d-up-think.vercel.app)
- Snapshot timestamp: `2026-09-18T22:18:12.045Z`
- Recorded status: `READY`

This is a useful comparison point, but it is not proof that the later failure was caused by the changes between these commits. Compare their diffs and the failed deployment's actual logs before changing code.

## Debug procedure

1. **Confirm the current deployment and branch.** In Vercel, open the WEARO project and select the deployment corresponding to the current `feature/product-admin` commit. Do not rely on this old export for current status.
2. **Read Build Logs first.** Capture the first meaningful error, the command that failed, and the relevant file/line. Avoid diagnosing from the final generic “Build Failed” line alone.
3. **Check CI separately.** If a GitHub Actions/static gate failed, inspect that workflow's log; a Vercel build failure and a GitHub CI failure are separate signals.
4. **Check environment only when evidence points there.** Compare required environment-variable names and scopes (Preview vs Production); never copy secret values into this file, GitHub issues, or chat.
5. **Apply the smallest fix.** Identify the layer and file, patch only the cause, then rerun the exact failed check.
6. **Verify after the fix.** Confirm GitHub checks, Vercel deployment status, and the relevant page/API behavior. A successful deployment alone does not prove every application flow works.

## Safe use of this document

- Keep it as historical diagnostic context, not an application data source.
- Do not import it into the frontend or use it to determine live deployment status.
- Do not commit local credentials, access tokens, environment-variable values, or raw personal account data.
- Refresh the observations only from a newly retrieved Vercel deployment/log export and include the retrieval date.
