# STAT 121 live class polls

Students open `/stat-121/polls/?poll=…` by scanning a QR code. They do not need an
account. The instructor creates a multiple-choice question at `/stat-121/polls/`,
then opens **Projector view** in a separate tab for the classroom screen.

Voting opens immediately; results start hidden. **Close voting / Reopen voting**
and **Reveal results / Hide results** control the poll independently. Both student
and projector views refresh every two seconds, pause in background tabs, and retry
with backoff when the connection fails.

## One-time Vercel setup

1. Open the `jamesblair-me` project in Vercel. Check **Settings → Environment
   Variables** for `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
   Existing `KV_REST_API_URL` and `KV_REST_API_TOKEN` variables also work.
2. If neither pair is present, create/connect an **Upstash Redis** database through
   the [Vercel Marketplace](https://vercel.com/marketplace/upstash) and connect it
   to this project. The integration supplies the Redis environment variables.
3. Add `POLL_ADMIN_KEY` as a sensitive server-side environment variable for the
   deployment environments you use. Generate a long, random key with a password
   manager or `openssl rand -hex 24`. Save it in your password manager; enter it
   only in the instructor form. Students never receive this key.
4. Redeploy after setting environment variables. The feature is not ready for
   class until these variables are configured and the new code is deployed.

All Redis requests originate from `/api/polls`. Secrets are never returned to
students or embedded in browser code. Missing configuration produces a setup
message, not a misleading local-only poll.

## Run a poll

1. Open **STAT 121 → Live Class Polls**, enter a question and 2–6 unique answers,
   enter the instructor key, and select **Create poll**.
2. Select **Projector view** and display that tab. Students scan its QR code.
3. Keep the instructor tab available to close voting and reveal results.
4. Use **New poll** for the next question. **Your recent polls** lets you reopen
   instructor controls in the browser that created the poll.

Each poll expires after seven days. Instructor capability tokens are saved in
the creating browser's local storage; clearing storage loses instructor access
to existing polls. The public student/projector links never contain these tokens.
The projector view requests only publicly revealed results, even when opened in
the instructor's browser.

Votes are anonymous and limited to one per browser using a random browser ID.
Retrying a vote cannot count it twice. Students cannot change their submitted
answer; opening another browser or clearing storage can bypass this limit, so
use this for classroom discussion rather than graded assessment. No names,
email addresses, or student accounts are collected. Redis stores a hash of the
browser ID and removes all poll data at expiration.

The Redis Lua script makes vote deduplication, counts, status changes, and reads
atomic across serverless instances. Hidden answer counts are withheld by the
API, not merely hidden with CSS. The instructor can read counts privately, but
the page displays the chart only after results are revealed.

Polling consumes API requests and Redis commands. For a 100-student class running
a poll for five minutes, two-second polling is about 15,000 reads, plus votes and
instructor/projector reads. Check your Vercel and Upstash quotas for your class size.

## Development and verification

Use `vercel dev` with the three values above in an ignored `.env.local` file.
The static `npm run serve` server previews the layout but does not serve the API.
Run `npm run test:polls` for API checks. With a local Redis server installed,
set `POLL_TEST_REDIS=1` to also execute the real Lua script against Redis.

QR codes are generated locally using the vendored MIT-licensed
[qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) library.
No student links are sent to a QR-code service.
