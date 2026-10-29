/**
 * Whether the HTML of /admin/login comes from a working Payload admin: with
 * no user yet it redirects to the first-user form (a streamed
 * `NEXT_REDIRECT`), otherwise it renders the login view. Payload's error
 * page (for example without a database schema) has neither, although it is
 * also sent with HTTP 200.
 *
 * The login view is recognised by the `login__brand` wrapper that Payload's
 * server-side `LoginView` always renders (`@payloadcms/next` views/Login).
 * With a user in the database the response carries the view only in the
 * React Server Components payload (`"className":"login__brand"`, escaped
 * inside a script), not as HTML elements, so the email input is no sign at
 * all; both forms of the wrapper are accepted.
 */
export function isReadyAdminLogin(html) {
  return (
    /NEXT_REDIRECT;replace;\/admin\/create-first-user;/.test(html) ||
    /<div[^>]*\bclass="(?:[^"]*\s)?login__brand(?:\s[^"]*)?"/.test(html) ||
    /\\?"className\\?":\\?"login__brand\\?"/.test(html) ||
    /<input[^>]*\bname="email"/.test(html)
  );
}
