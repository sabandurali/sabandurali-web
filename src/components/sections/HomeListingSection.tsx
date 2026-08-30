import Link from "next/link";
import type { ReactNode } from "react";
import type { HomeListingSectionContent } from "@/content/homeContent";

type HomeListingSectionProps = {
  children: ReactNode;
  content: HomeListingSectionContent;
  href: string;
  tone?: "default" | "soft" | "light";
};

export default function HomeListingSection({
  children,
  content,
  href,
  tone = "default",
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
      <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-10 lg:py-24">
        <div className="mb-10 flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
          <h2
            className={`text-4xl font-semibold tracking-tight sm:text-5xl ${
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
