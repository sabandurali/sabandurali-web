import { NextResponse, type NextRequest } from "next/server";
import { assistantBranch, demoPathAllowed, isAssistantPreview } from "./lib/assistant/environment";

export function proxy(request: NextRequest) {
  const env = process.env;
  if (env.ASSISTANT_DEMO_ONLY !== "true" && env.VERCEL_GIT_COMMIT_REF !== assistantBranch)
    return NextResponse.next();
  if (!isAssistantPreview(env)) return new NextResponse("Demo configuration unavailable", { status: 503 });
  const path = request.nextUrl.pathname;
  if (path === "/" || path === "/en")
    return NextResponse.redirect(new URL(path === "/" ? "/istanbul-asistani" : "/en/istanbul-research-assistant", request.url));
  // This deployment serves only the read-only assistant; CMS/admin/media APIs never execute.
  if (!demoPathAllowed(path)) return new NextResponse("Not found", { status: 404 });
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
