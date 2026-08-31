import Link from "next/link";
import type { ReactNode } from "react";
import type { HomeListingSectionContent } from "@/content/homeContent";

type HomeListingSectionProps = {
  children: ReactNode;
  content: HomeListingSectionContent;
  href: string;
  tone?: "default" | "soft" | "light";
  compact?: boolean;
};

export default function HomeListingSection({
  children,
  content,
  href,
  tone = "default",
  compact = false,
}: HomeListingSectionProps) {
  return (
    <section
      className={
        tone === "light"
          ? "bg-ivory text-ink"
          : tone === "soft"
            ? "bg-ivory-soft text-ink"
            : "bg-background"
      }
    >
      <div className={`mx-auto max-w-7xl px-5 ${compact ? "py-10 sm:py-12 lg:px-10 lg:py-14" : "py-12 sm:py-16 lg:px-10 lg:py-18"}`}>
        <div className={`${compact ? "mb-7 pb-5" : "mb-10 pb-7"} flex flex-col gap-5 border-b border-border sm:flex-row sm:items-end sm:justify-between`}>
          <h2
            className={`text-[2.15rem] font-semibold tracking-tight sm:text-5xl ${
              tone === "default" ? "text-ivory" : "text-ink"
            }`}
          >
            {content.title}
          </h2>
          <Link
            href={href}
            className={`inline-flex min-h-11 items-center self-start text-sm font-semibold underline decoration-border underline-offset-4 transition-colors motion-reduce:transition-none sm:self-auto ${
              tone === "default"
                ? "text-accent-soft hover:text-ivory"
                : "text-accent hover:text-ink"
            }`}
          >
            {content.linkLabel} →
          </Link>
        </div>
        {children}
      </div>
    </section>
  );
}
