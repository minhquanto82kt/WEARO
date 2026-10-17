# AI backend operations

## Lifecycle

```text
queued -> processing -> completed
                    \-> failed
```

Supabase `try_on_jobs` is the durable source of truth. The provider layer remains replaceable. The browser can reconcile a job while the shopper is on the Try-On page; it should not create a second job merely because a provider takes longer than the first polling window.

## Worker

`POST /api/try-on/internal/worker/reconcile` is protected by `CRON_SECRET` and processes a bounded batch. `GET /api/try-on/internal/worker/metrics` uses the same secret.

**Scheduling status:** no schedule is currently declared in `vercel.json`. The linked Vercel workspace is on Hobby, which permits only daily Cron execution; that cadence is not appropriate for a responsive Try-On queue. Do not add a frequent Vercel Cron expression on Hobby because Vercel rejects it during deployment. For automatic background reconciliation, use a plan/scheduler that supports frequent invocations, configure `CRON_SECRET` in the scheduler and Python runtime, and invoke `POST /api/try-on/internal/worker/reconcile?limit=10` with `Authorization: Bearer <CRON_SECRET>`. Keep the secret server-side.

## Required runtime configuration

- Root/TanStack server: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`.
- Python/FastAPI: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (same value as root `SUPABASE_SECRET_KEY`), `STORAGE_BUCKET=try-on-assets`, `CRON_SECRET`.
- Hosted FASHN: `TRY_ON_PROVIDER=fashn` and `FASHN_API_KEY`. The default `TRY_ON_PROVIDER=stub` intentionally does not run real image generation.
- The `try-on-assets` bucket should remain private; result URLs are signed and time-limited.

Never commit real keys. Set values in the appropriate Vercel environment and redeploy after changing them.

## Metrics

`GET /api/try-on/internal/worker/metrics` reports a bounded recent sample by status/provider plus recent failures. It is operational telemetry, not a billing or financial report.

## Optimization loop

```text
Colab experiment
  -> benchmark
  -> evaluation
  -> production configuration
  -> durable jobs
  -> metrics
  -> next experiment
```
