import Image from "next/image";
import type { ReactNode } from "react";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { Figure } from "@/components/ui/Figure";
import Section, { type SectionTone } from "@/components/ui/Section";
import SectionSign from "@/components/ui/SectionSign";
import { SourceRefList } from "@/components/ui/SourceRef";
import TextLink from "@/components/ui/TextLink";
import { getPhotoPath } from "@/content/photos/photo-routes";
import type { PublicPhoto } from "@/content/photos/types";
import { formatDate, toDateTimeAttribute } from "@/lib/format-date";
import {
  districtPhotoCaption,
  districtPhotoCredit,
  splitParagraphs,
  type VisibleDistrictSection,
} from "./district-guide-model";

/** Shared building blocks of the district guide sections. */

export const missingText = "Bu bölüm için doğrulanmış içerik henüz eklenmedi.";
export const unavailableText = (what: string) =>
  `${what} geçici olarak yüklenemedi. Sayfayı biraz sonra yeniden açın.`;

/**
 * Class of the paragraph stack. The gap lives on the container: a
 * `space-y-*` rule has zero specificity in Tailwind 4 and loses to the
 * paragraphs' own `m-0`, which ran every paragraph into the next.
 */
export const proseStackClassName = "grid max-w-measure gap-5 type-body";

export function Prose({
  value,
  empty = missingText,
}: {
  value: string | null | undefined;
  empty?: ReactNode;
}) {
  const paragraphs = splitParagraphs(value);
  if (paragraphs.length === 0) return <EmptyState>{empty}</EmptyState>;
  return (
    <div className={proseStackClassName}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="m-0 whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export function GuideSection({
  section,
  total,
  heading,
  tone = "paper",
  wide,
  children,
}: {
  section: VisibleDistrictSection;
  total: number;
  heading?: string;
  tone?: SectionTone;
  /** Full-width content under the two columns (the tile map). */
  wide?: ReactNode;
  children: ReactNode;
}) {
  const headingId = `${section.id}-baslik`;
  return (
    <Section
      id={section.id}
      labelledBy={headingId}
      tone={tone}
      spacing="compact"
      divider
      className="scroll-mt-4"
    >
      {/* Wide screens: the sign and heading stay in a left rail while the
          reading column scrolls; narrow screens stack them. */}
      <div className="lg:grid lg:grid-cols-[minmax(13rem,18rem)_minmax(0,1fr)] lg:gap-x-14">
        <div className="lg:sticky lg:top-6 lg:self-start">
          <SectionSign
            number={section.number}
            total={total}
            label={section.label}
            end={section.number === total}
          />
          <h2 id={headingId} className="mt-5 mb-0 max-w-[24ch] type-h2">
            {heading ?? section.heading}
          </h2>
        </div>
        <div className="mt-7 grid min-w-0 gap-8 lg:mt-0">{children}</div>
      </div>
      {wide ? <div className="mt-10">{wide}</div> : null}
    </Section>
  );
}

export function Sources({
  numbers,
  label,
}: {
  numbers: readonly number[];
  label?: string;
}) {
  return <SourceRefList numbers={numbers} label={label} className="-my-2" />;
}

/**
 * Loading attributes of a district photo. The page's LCP candidate (the
 * hero) is fetched eagerly at high priority: Next 16 recommends this over
 * `preload`, whose head preload keeps the browser's default low image
 * priority. Every other photo stays lazy.
 */
export function districtPhotoLoading(
  priority: boolean,
): { loading: "eager"; fetchPriority: "high" } | { loading: "lazy" } {
  return priority
    ? { loading: "eager", fetchPriority: "high" }
    : { loading: "lazy" };
}

/**
 * One district photo with its caption and credit. The caption's title
 * links to the photo's own page (/fotograflar/<slug>), so every photo the
 * guide shows joins the photo archive's internal links.
 */
export function DistrictPhoto({
  photo,
  priority = false,
  sizes,
}: {
  photo: PublicPhoto;
  /** The page's LCP candidate: the hero photo above the fold. */
  priority?: boolean;
  sizes: string;
}) {
  const historical = photo.districtPhotoCategory === "tarih";
  const { title, details } = districtPhotoCaption(photo);
  return (
    <Figure
      credit={districtPhotoCredit(photo)}
      caption={
        <>
          {historical ? (
            <Badge tone="neutral" className="mr-2">
              Tarihî arşiv
            </Badge>
          ) : null}
          <TextLink href={getPhotoPath(photo.slug, photo.language)}>
            {title ?? "Fotoğrafın sayfası"}
          </TextLink>
          {details ? ` · ${details}` : null}
        </>
      }
    >
      <div
        className={
          historical
            ? "rounded-card border border-ink bg-land p-3"
            : "overflow-hidden rounded-card bg-band"
        }
      >
        <Image
          src={photo.image.src}
          alt={photo.image.alt}
          width={photo.image.width ?? 1600}
          height={photo.image.height ?? 900}
          sizes={sizes}
          {...districtPhotoLoading(priority)}
          className={
            historical
              ? "mx-auto h-auto max-h-[48rem] w-auto max-w-full object-contain"
              : "aspect-video h-auto w-full object-cover"
          }
        />
      </div>
      {photo.description && !historical ? (
        <p className="mt-2 mb-0 max-w-measure type-small text-ink-muted">
          {photo.description}
        </p>
      ) : null}
    </Figure>
  );
}

export function MetaLine({ parts: all }: { parts: ReactNode[] }) {
  const parts = all.filter(Boolean);
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 type-caption text-ink-muted">
      {parts.map((part, index) => (
        <span key={index} className="inline-flex items-center gap-2">
          {index > 0 ? <span aria-hidden="true">·</span> : null}
          {part}
        </span>
      ))}
    </p>
  );
}

export function TimeText({ value }: { value: string | null | undefined }) {
  const label = formatDate(value);
  const dateTime = toDateTimeAttribute(value);
  if (!label) return null;
  return dateTime ? <time dateTime={dateTime}>{label}</time> : <>{label}</>;
}
