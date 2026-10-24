# Changelog

Notable repository changes for `fashion-dream-try-on-main`. This is a maintenance history, not a claim that every entry was released to production. Deployment status should be verified in GitHub Actions and Vercel.

## 2026-10-24

- **Documentation:** Added a live GitHub Actions status badge and links to the Vercel project and source branch in the README. The badge reflects workflow status only; it does not guarantee runtime, database, payment, or AI-provider health.
  - Commit: [f321814](https://github.com/minhquanto82kt/WEARO/commit/f321814a397d05fec0758202814c911a913e6c52)

## 2026-10-23

- **Backend checks:** Added safe backend environment preflight checks.
  - Commit: [fcb12d7](https://github.com/minhquanto82kt/WEARO/commit/fcb12d71361c040b6ed870820ba62121480e1323)
- **Security checks:** Added a static backend API security audit and commands for backend preflight/API security checks.
  - Commits: [04d1559](https://github.com/minhquanto82kt/WEARO/commit/04d15594a22f28439a4fcceb19618c251e45d00a), [4610d18](https://github.com/minhquanto82kt/WEARO/commit/4610d18a699bcc5e8644f25d6aa2e049a8ece247)
- **Documentation:** Clarified the component styles directory and canonical style ownership/migration rules.
  - Commits: [ddd7771](https://github.com/minhquanto82kt/WEARO/commit/ddd77716887892d5912c296cbeefc081e4f9fcf3), [7560cba](https://github.com/minhquanto82kt/WEARO/commit/7560cbaebb23f644999527938655083c60aa3840)

## Deployment marker review

- `.deploy-trigger` contains a dated note for a redeploy on 2026-09-14.
- `.vercel-rebuild-marker.md` describes a temporary Vercel rebuild marker.
- A repository code search did not find references to either filename. They are not deleted in this change because they may be retained as deployment/audit breadcrumbs; confirm they are no longer operationally needed before removing them.
