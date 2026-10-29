/**
 * Whether the HTML of /admin/login comes from a working Payload admin: with
 * no user yet it redirects to the first-user form (a streamed
 * `NEXT_REDIRECT`), otherwise it renders the login form. Payload's error
 * page (for example without a database schema) has neither, although it is
 * also sent with HTTP 200.
 */
export function isReadyAdminLogin(html) {
  return (
    /NEXT_REDIRECT;replace;\/admin\/create-first-user;/.test(html) ||
    /<input[^>]*\bname="email"/.test(html)
  );
}
