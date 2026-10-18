// Only Node tests resolve Next's server-only marker to its bundled empty module.
// Application builds keep Next's real server/client import boundary check.
import { registerHooks } from "node:module";
registerHooks({ resolve(specifier, context, nextResolve) {
  return nextResolve(specifier === "server-only" ? "next/dist/compiled/server-only/empty.js" : specifier, context);
} });
