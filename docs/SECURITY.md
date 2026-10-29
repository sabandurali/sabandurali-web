# Security runbook

What the application enforces itself, and what only the owner can configure
outside the repository. Every step marked **Owner** changes a production
service (Vercel Firewall, environment, user accounts) and is never done by a
coding agent (CLAUDE.md, rule 2).

## 1. Admin sign-in: lockout, rate limit and a second admin

### What the application does

- `src/collections/Users.ts`: after `MAX_LOGIN_ATTEMPTS` (5) failed logins
  Payload locks the account for `LOGIN_LOCK_TIME_MS` (10 minutes). Only an
  admin can unlock an account (`access.unlock`).
- Password reset by email is refused while no email adapter is configured
  (`refusePasswordResetWithoutEmail`): a locked-out or forgotten password is
  recovered only by another admin.
- The last admin cannot be deleted or demoted (`src/lib/payloadDeleteGuards.ts`).

### The gap

The lock belongs to the account, not to the client. Anyone who knows the
admin email can send 5 wrong passwords every 10 minutes and keep the account
locked; while it is locked the correct password is refused too. Nothing
limits slow password spraying across many emails either.

An in-app counter does not fix this on Vercel: functions run on many
short-lived instances, so a counter in memory is neither shared nor durable.
A reliable counter needs a shared store (Upstash Redis or similar), which is a
new service and new environment variables, so it is an owner decision. The
platform rule below needs neither.

### Owner: Vercel Firewall rate-limit rule

Create one custom rule in the project's Firewall (dashboard: Project →
Firewall → Rules, or the Vercel CLI). Check first that rate limiting is
available on the current plan.

| Setting | Value |
|---|---|
| Name | `Admin auth rate limit` |
| Conditions (OR) | path equals `/api/users/login` · path equals `/api/users/first-register` · path equals `/api/users/forgot-password` · path equals `/api/users/reset-password` · path equals `/api/users/unlock` |
| Action | Rate limit |
| Key | IP |
| Algorithm | Fixed window |
| Window | 60 seconds |
| Requests per window | 10 |
| When exceeded | Rate limit (HTTP 429) |

The same rule with the CLI (`vercel firewall rules add`; review the rule and
publish the firewall change if the CLI or dashboard asks for it):

```bash
vercel firewall rules add "Admin auth rate limit" \
  --condition '{"type":"path","op":"eq","value":"/api/users/login"}' \
  --or --condition '{"type":"path","op":"eq","value":"/api/users/first-register"}' \
  --or --condition '{"type":"path","op":"eq","value":"/api/users/forgot-password"}' \
  --or --condition '{"type":"path","op":"eq","value":"/api/users/reset-password"}' \
  --or --condition '{"type":"path","op":"eq","value":"/api/users/unlock"}' \
  --action rate_limit \
  --rate-limit-window 60 \
  --rate-limit-requests 10 \
  --rate-limit-keys ip \
  --rate-limit-action rate_limit
```

Ten requests a minute leave room for a person who mistypes and slow down
scripted guessing and password spraying from one address. The admin UI signs
in with `POST /api/users/login`, so the rule covers it.

What the rule does **not** fix: locking one known account needs only 5 wrong
passwords every 10 minutes, which stays below any per-IP limit that still lets
a person sign in. The targeted lockout therefore remains possible; the
mitigation for it is the second admin below, who can unlock the account.

Verification after publishing (read-only, from one IP):

1. Sign in to `/admin` normally: it works.
2. Send 11 quick wrong logins to `/api/users/login` for a test address that
   has no account: the 11th answer is 429 and the Firewall overview shows the
   rule matching.
3. Record the date of the check in this file.

Status: **not configured yet** (no rule is recorded in this repository).

### Owner: keep a second admin

Without an email adapter the only way back into a locked or forgotten admin
account is another admin. Keep at least two admin accounts, owned by
different people or at least different devices and password managers:

1. Signed in as admin: `/admin/collections/users` → *Create New*, role
   `Admin`, a long unique password.
2. Sign in once with the new account to confirm it works, then sign out.
3. Check the count every few months and after removing an account. The
   application only guarantees one admin.

Status: **owner to confirm** (the number of production admins is not visible
from the repository).

## 2. Content-Security-Policy

`src/lib/securityHeaders.ts` holds both policies; `next.config.ts` sends
them, `src/lib/securityHeaders.test.ts` and `npm run e2e:headers` check them
from the same module.

### Enforced on every route

`base-uri 'self'; form-action 'self' https://formspree.io;
frame-ancestors 'none'; object-src 'none'` plus `X-Frame-Options: DENY`. It
sets no script or fetch directives; the module comment explains why.

### Report-only on public routes

`Content-Security-Policy-Report-Only` with a full candidate policy
(`default-src 'self'`, `script-src 'self' 'unsafe-inline'` plus the Vercel
toolbar, images from this origin and Vercel Blob, `connect-src` for
Formspree, …) on every route except `/admin`, `/api` and `/_next/image`.
Browsers block nothing because of it; they print each violation to the
console.

There is no reporting endpoint yet (`report-to` / `report-uri`), so
violations are only seen in the browser's DevTools.

### Next steps (in order)

1. **Watch a Preview deployment** (needs the owner's go-ahead for the push):
   open the home pages, a district guide, an article, a book review, the
   photo pages and the contact form in DevTools with the toolbar active, and
   list every `[Report Only]` message. Widen the policy only for a source the
   site really uses.
2. **Collect reports** (optional): add a small `/api/csp-report` route or a
   reporting service and set `report-to`. A route is application code and a
   reporting service is an owner decision.
3. **Remove `'unsafe-inline'` from `script-src`**: either per-request nonces
   (every page becomes dynamically rendered; see
   `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`)
   or Next.js SRI. Measure the cost first.
4. **Enforce**: move the directives from the report-only header to the
   enforced one once a Preview deployment shows no violations.
5. **Admin policy**: the Payload admin loads Monaco from `cdn.jsdelivr.net`
   and runs workers; it needs its own report-only policy before any
   enforcement.

## 3. Anonymous REST API

The REST API at `/api/*` is part of the public surface (CLAUDE.md, rule 5).

- `src/lib/payloadAccess.ts`: anonymous lists are capped
  (`limitAnonymousRestQueries`), Media cannot be listed, District Guides
  allow only listed query paths.
- Editorial fields carry `access.read: editorialFieldRead`: anonymous REST
  and GraphQL readers neither receive them nor filter on them, while editors
  and the server's Local API (whose mappers drop them) keep reading them.
  Book reviews use it for `authorId`, `editorId`, `showOnHomepage`,
  `translationStatus` and `relatedBooks`; `reviewStatus` is removed in
  `afterRead` because the collection read access itself filters on it.
- A new private field gets `editorialFieldRead` (or stricter) and a
  `cms.integration.test.ts` case that reads it anonymously over REST.
