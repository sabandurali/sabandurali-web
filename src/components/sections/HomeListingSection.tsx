import type { ReactNode } from "react";
import EmptyState from "@/components/ui/EmptyState";
import Section, { type SectionTone } from "@/components/ui/Section";
import TextLink from "@/components/ui/TextLink";
import type { SiteLocale } from "@/lib/metadata";
import HomeSectionHeading from "./HomeSectionHeading";

type HomeListingSectionProps = {
  id: string;
  locale: SiteLocale;
  tone?: Exclude<SectionTone, "sea">;
  number: string;
  eyebrow: string;
  title: string;
  /** "Tüm makaleler" and its list page; shown only when there are items. */
  linkLabel: string;
  href: string;
  /** Plain sentence shown instead of the list when it is empty. */
  emptyMessage: string;
  /** Number of items rendered as children. */
  itemCount: number;
  children: ReactNode;
};

/**
 * One "latest" list of the home page (articles, book reviews, photos): a
 * numbered heading, a card grid and the link to the full list. Without
 * published items it shows an explicit empty state, never filler.
 */
export default function HomeListingSection({
  id,
  locale,
  tone = "paper",
  number,
  eyebrow,
  title,
  linkLabel,
  href,
  emptyMessage,
  itemCount,
  children,
}: HomeListingSectionProps) {
  const headingId = `${id}-baslik`;
  const hasItems = itemCount > 0;

  return (
    <Section
      id={id}
      tone={tone}
      labelledBy={headingId}
      spacing={hasItems ? "default" : "compact"}
    >
      <HomeSectionHeading
        id={headingId}
        number={number}
        eyebrow={eyebrow}
        title={title}
        action={
          hasItems ? (
            <TextLink href={href} variant="standalone" locale={locale}>
              {linkLabel}
            </TextLink>
          ) : undefined
        }
      />
      <div className="mt-8">
        {hasItems ? children : <EmptyState>{emptyMessage}</EmptyState>}
      </div>
    </Section>
  );
}
