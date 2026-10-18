import type { Metadata } from "next";
import { connection } from "next/server";
import ResearchAssistant from "@/components/assistant/ResearchAssistant";
import { catalogue, snapshotInfo } from "@/lib/assistant/research";
import { claudeConfigured } from "@/lib/assistant/claude";
export const metadata: Metadata = {
  title: "İstanbul Araştırma Asistanı | Şaban Durali",
  description:
    "39 yayımlanmış ilçe rehberinden kaynaklı araştırma ve karşılaştırma prototipi.",
  robots: { index: false, follow: false },
};
export default async function AssistantPage() {
  await connection();
  return (
    <ResearchAssistant
      districts={catalogue}
      snapshot={snapshotInfo}
      mode={claudeConfigured() && !process.env.VERCEL ? "claude" : "local"}
    />
  );
}
