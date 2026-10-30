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
- Every password that is set (first registration, a new user, a profile edit,
  a reset) needs at least `MIN_PASSWORD_LENGTH` (12) characters and must not
  be the account's email address or its local part (`enforcePasswordPolicy`;
  Payload's own minimum is 3). Existing passwords keep working until they are
  changed; the owner may ask every account holder to set a new one. The hook
  runs before Payload's access check, so it reads the stored email with the
  caller's own access: a caller who may not update an account gets 403, never
  a password error that would confirm a guessed email.
- No account oracle at sign-in: a locked account answers with the same 401
  and message as an unknown address or a wrong password
  (`hideLockedAccountOnLogin`), and an unknown or locked account spends the
  same PBKDF2 work as a real password check (`equalizeLoginTiming`), so
  neither the text nor the response time tells whether an address has an
  account. The lock still applies and Payload still logs it; an admin sees
  and clears it on the account (`access.unlock`). A locked-out person
  therefore sees "wrong email or password" until the lock expires or an
  admin unlocks the account.
- The session JWT lives only in the HttpOnly `payload-token` cookie
  (`SameSite=Lax`, `Secure` on HTTPS). `auth.removeTokenFromResponses` keeps
  it out of the JSON bodies of login, `/api/users/me`, refresh and reset, so
  a same-origin script cannot read it and replay it as an
  `Authorization: JWT` header, which neither SameSite nor the CSRF allowlist
  covers. The admin panel works from the cookie alone.

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

Status: **configured and verified on 2026-10-30.** The live rule uses one
condition instead of the five above: path matches the regular expression
`^/api/users/(login|first-register|forgot-password|reset-password|unlock)$`,
with the same rate limit (10 requests per 60 seconds per IP, fixed window,
HTTP 429). Check after every edit that the expression has no trailing line
break: a value pasted with a newline (`…unlock)$\n`) matches nothing, which
is how the first published version failed silently. `vercel firewall rules
inspect "Admin auth rate limit" --json` shows the exact stored value.
Verification: 10 wrong logins for an address without an account answered
401, the 11th to 15th answered 429, and the home page and `/api/books` kept
answering 200.

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

### Report-only on the admin

`/admin` and every page below it (`ADMIN_ROUTES_SOURCE`) get their own
`Content-Security-Policy-Report-Only`
(`adminContentSecurityPolicyReportOnlyDirectives`): the public candidate plus
Monaco from `cdn.jsdelivr.net`, `data:` fonts and `blob:` media. `/api/*` and
`/_next/image` get neither report-only header; `npm run e2e:headers` checks
all three cases.

There is no reporting endpoint yet (`report-to` / `report-uri`), so
violations are only seen in the browser's DevTools.

### Current risk (accepted until the steps below are done)

No enforced directive restricts scripts or fetches, on the public site or
on `/admin` (where the session cookie lives), and both report-only
candidates still allow `'unsafe-inline'`. Against a cross-site scripting bug
(in Payload's admin UI or a dependency, for example) the browser therefore
adds no second layer today; the defences are in the code: React escaping,
`serializeJsonLd` for JSON-LD and `getSafeHref` for every stored link. The
report-only headers collect nothing from real visitors, so they cannot
show yet that enforcing is safe. This is deliberate and staged: no script
policy is enforced before a Preview deployment has been watched (step 1).
The smallest later gain is enforcing a host allowlist for scripts on the
admin (`script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'`), which
blocks scripts from any other origin without nonces; it belongs after step 1
and needs the owner's decision.

### Vercel Web Analytics

`<Analytics />` from `@vercel/analytics/next` (pinned) is rendered once in
each public root layout (`src/app/(tr)/layout.tsx`, `src/app/(en)/layout.tsx`),
never in the Payload admin. In a production build it loads
`/_vercel/insights/script.js` and sends page views to `/_vercel/insights/*`:
same origin, so the enforced policy (no script or fetch directive) and the
report-only policy (`script-src 'self'`, `connect-src 'self'`) both allow
it. It sets no cookie and uses no Web Storage. `src/lib/web-analytics.test.ts`
pins all of this. Only `npm run dev` loads the debug script from
`https://va.vercel-scripts.com`; the report-only policy then prints one
`[Report Only]` message in development, which is expected and blocks
nothing. On `next start` outside Vercel the script path returns 404 and no
page view is sent. The privacy notice text is the owner's decision.

### Next steps (in order)

1. **Watch a Preview deployment** (needs the owner's go-ahead for the push):
   open the home pages, a district guide, an article, a book review, the
   photo pages and the contact form in DevTools with the toolbar active, and
   list every `[Report Only]` message. Widen the policy only for a source the
   site really uses.
2. **Collect reports** (optional, deliberately not built yet): a
   `/api/csp-report` route would be an anonymous POST endpoint that writes
   to the logs. Until the admin auth rate limit of §1 exists in the Vercel
   Firewall it could be used to flood the logs, and step 1 (DevTools on a
   Preview) already shows every violation. Add the route, with a body size
   limit and a Firewall rate limit, or a reporting service (owner decision),
   only when enforcing (step 4) is near; then set `report-to`.
3. **Remove `'unsafe-inline'` from `script-src`**: either per-request nonces
   (every page becomes dynamically rendered; see
   `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`)
   or Next.js SRI. Measure the cost first.
4. **Enforce**: move the directives from the report-only header to the
   enforced one once a Preview deployment shows no violations.
5. **Admin policy**: the Payload admin loads Monaco from `cdn.jsdelivr.net`
   and runs workers, so it has its own report-only policy (see "Report-only
   on the admin" above), sent since fix round 6. Watch it on the same
   Preview as step 1 (sign in, open a district guide's JSON field and the
   media upload view) before any enforcement.

### Local measurement (2026-10-29)

A local production build (`next start`, SQLite, CI environment) was opened
in Chrome with Playwright:

- Public routes (home TR/EN, about, contact TR/EN, privacy notice, district
  index and two district guides, focus areas, a section page, books,
  articles, photography TR/EN, a 404) at 1440 px, plus the home and a
  district guide at 390, 820 and 1440 px: **no violation** of the
  report-only policy. The only console errors are the expected
  `/_vercel/insights/script.js` 404 outside Vercel.
- Admin, with the candidate injected as a report-only header by the test
  harness (the server did not send it then; it does now): login, dashboard, collection lists,
  create views with Lexical typing, the district guide JSON field rendered
  in Monaco, the media upload view, the Navigation global and the account
  view: **no violation** once `admin.avatar` was set to `"default"`.
  Before that, Payload's default Gravatar avatar loaded
  `https://www.gravatar.com/avatar/<email hash>` on every admin page.

This does not cover a Vercel Preview (toolbar, Blob media, Web Analytics),
so step 1 still needs the owner's Preview check. Neither candidate is a
script defence yet: both keep `'unsafe-inline'` (step 3).

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
- Rich text fields carry `hideNonPublicRichTextLinks` (`afterRead`). Lexical
  stores an internal link as `{ relationTo, value: <id> }` and replaces the ID
  only when the request asks for enough `depth`; for anonymous REST and
  GraphQL readers the hook keeps an unpopulated ID only when that reader may
  read the target itself, so `?depth=0` cannot name a draft or scheduled
  document. A new rich text field gets the same hook
  (`src/lib/payloadAccess.test.ts` checks every one).
- A new private field gets `editorialFieldRead` (or stricter) and a
  `cms.integration.test.ts` case that reads it anonymously over REST.
