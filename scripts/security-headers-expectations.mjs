/**
 * Whether the HTML of /admin/login comes from a working Payload admin: with
 * no user yet it redirects to the first-user form (a streamed
 * `NEXT_REDIRECT`), otherwise it renders the login view. Payload's error
 * page (for example without a database schema) has neither, although it is
 * also sent with HTTP 200.
 *
 * The login view is recognised by the `login__brand` wrapper that Payload's
 * server-side `LoginView` always renders (`@payloadcms/next` views/Login).
 * The email input is not a reliable sign: once a user exists the login form
 * is a client component whose fields are not always in the server HTML.
 */
export function isReadyAdminLogin(html) {
  return (
    /NEXT_REDIRECT;replace;\/admin\/create-first-user;/.test(html) ||
    /<div[^>]*\bclass="(?:[^"]*\s)?login__brand(?:\s[^"]*)?"/.test(html) ||
    /<input[^>]*\bname="email"/.test(html)
  );
}
