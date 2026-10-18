import { handleResearch } from "@/lib/assistant/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return handleResearch(request);
}
