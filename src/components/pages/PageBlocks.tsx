import Image from "next/image";
import PayloadRichText from "@/components/articles/PayloadRichText";
import { AreaIcon } from "@/components/sections/FocusAreas";
import type {
  PublicPageBlock,
  PublicPageLink,
} from "@/content/pages/public-types";

function ActionLink({
  action,
  primary = false,
}: {
  action: PublicPageLink;
  primary?: boolean;
}) {
  const external =
    action.href.startsWith("http://") ||
    action.href.startsWith("https://");

  return (
    <a
      href={action.href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={
        primary
          ? "rounded-md bg-accent px-7 py-3.5 text-center text-sm font-medium text-ink transition hover:bg-accent-strong"
          : "rounded-md border border-ivory/40 px-7 py-3.5 text-center text-sm font-medium text-ivory transition hover:border-accent hover:bg-surface"
      }
    >
      {action.label}
    </a>
  );
}

function HeroPageBlock({
  block,
}: {
  block: Extract<PublicPageBlock, { blockType: "hero" }>;
}) {
  return (
    <section
      id={block.anchor ?? undefined}
      className="relative isolate scroll-mt-24 overflow-hidden border-b border-border"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_28%_42%,var(--accent-hero-glow),transparent_34%),linear-gradient(115deg,transparent_0%,transparent_47%,var(--accent-hero-sheen)_47%,var(--accent-hero-sheen)_63%,transparent_63%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-[8%] -z-10 hidden w-[42%] grid-cols-4 gap-px opacity-70 lg:grid"
      >
        <span className="border-x border-border/50 bg-black/10" />
        <span className="border-r border-border/40 bg-surface/20" />
        <span className="border-r border-border/50 bg-black/20" />
        <span className="border-r border-border/30 bg-surface/10" />
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-94px)] max-w-7xl items-center gap-14 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-24">
        <div className="min-w-0">
          {block.eyebrow !== null && (
            <p className="mb-6 text-xs font-medium uppercase leading-6 tracking-[0.18em] text-accent sm:text-sm sm:tracking-[0.22em]">
              {block.eyebrow}
            </p>
          )}
          <h1 className="max-w-4xl font-serif text-[2.65rem] font-medium leading-[1.08] tracking-[-0.035em] text-ivory sm:text-6xl lg:text-[72px]">
            {block.titleLines.map((line, index) => (
              <span
                key={`${line.text}-${index}`}
                className={`block ${line.accent ? "text-accent-strong" : ""}`}
              >
                {line.text}
              </span>
            ))}
          </h1>
          <p className="mt-8 max-w-2xl text-base leading-8 text-muted sm:text-lg">
            {block.description}
          </p>
          <div className="mt-10 flex flex-col gap-4 min-[360px]:flex-row min-[360px]:flex-wrap">
            <ActionLink action={block.primaryAction} primary />
            <ActionLink action={block.secondaryAction} />
          </div>
        </div>

        {block.highlights.length > 0 && (
          <aside className="rounded-2xl border border-border bg-black/25 p-7 shadow-[0_18px_50px_rgba(0,0,0,0.18)] sm:p-8">
            {block.highlights.map((highlight, index) => (
              <div key={`${highlight.value}-${highlight.label}`}>
                {index > 0 && <div className="my-7 h-px bg-border" />}
                <div>
                  <p className="text-4xl font-semibold tracking-tight text-accent">
                    {highlight.value}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {highlight.label}
                  </p>
                </div>
              </div>
            ))}
          </aside>
        )}
      </div>
    </section>
  );
}

function RichTextPageBlock({
  block,
}: {
  block: Extract<PublicPageBlock, { blockType: "richText" }>;
}) {
  return (
    <section
      id={block.anchor ?? undefined}
      className="scroll-mt-24 bg-background text-foreground"
    >
      <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24 lg:px-10">
        {block.eyebrow !== null && (
          <p className="text-sm uppercase tracking-[0.22em] text-accent">
            {block.eyebrow}
          </p>
        )}
        {block.title !== null && (
          <h2 className="mt-5 text-4xl font-semibold tracking-tight text-ivory sm:text-5xl">
            {block.title}
          </h2>
        )}
        <div className={block.title === null ? "" : "mt-8"}>
          <PayloadRichText data={block.content} />
        </div>
      </div>
    </section>
  );
}

function CardGroupPageBlock({
  block,
}: {
  block: Extract<PublicPageBlock, { blockType: "cardGroup" }>;
}) {
  return (
    <section
      id={block.anchor ?? undefined}
      className="scroll-mt-24 bg-ivory-soft text-ink"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
        <div className="mb-14 max-w-3xl">
          {block.eyebrow !== null && (
            <p className="text-sm uppercase tracking-[0.22em] text-muted-dark">
              {block.eyebrow}
            </p>
          )}
          <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl">
            {block.title}
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {block.cards.map((card) => (
            <article
              key={card.id}
              className="rounded-xl border border-[var(--accent-border-soft)] bg-ivory p-6 shadow-[0_8px_24px_rgba(18,22,25,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent-border-hover)] md:min-h-72"
            >
              {card.image === null ? (
                <div className="flex size-12 items-center justify-center rounded-full border border-accent bg-ink text-accent-soft">
                  <AreaIcon icon={card.icon} />
                </div>
              ) : card.image.width !== undefined &&
                card.image.height !== undefined ? (
                <Image
                  src={card.image.src}
                  alt={card.image.alt}
                  width={card.image.width}
                  height={card.image.height}
                  className="aspect-video w-full rounded-md border border-[var(--accent-border-soft)] object-cover"
                />
              ) : (
                <span className="relative block aspect-video overflow-hidden rounded-md border border-[var(--accent-border-soft)]">
                  <Image
                    src={card.image.src}
                    alt={card.image.alt}
                    fill
                    sizes="(min-width: 1280px) 280px, (min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </span>
              )}
              <h3 className="mt-6 text-2xl font-semibold tracking-tight">
                {card.title}
              </h3>
              <p className="mt-5 max-w-lg leading-7 text-muted-dark">
                {card.description}
              </p>
              {card.link !== null && (
                <a
                  href={card.link.href}
                  className="mt-8 inline-flex min-h-11 items-center text-sm font-medium underline decoration-[var(--accent-border-soft)] underline-offset-4"
                >
                  {card.link.label}
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ImageTextPageBlock({
  block,
}: {
  block: Extract<PublicPageBlock, { blockType: "imageText" }>;
}) {
  const image = (
    <div>
      {block.image.width !== undefined &&
      block.image.height !== undefined ? (
        <Image
          src={block.image.src}
          alt={block.image.alt}
          width={block.image.width}
          height={block.image.height}
          className="h-auto w-full rounded-xl border border-border object-cover"
        />
      ) : (
        <span className="relative block aspect-[4/5] overflow-hidden rounded-xl border border-border">
          <Image
            src={block.image.src}
            alt={block.image.alt}
            fill
            sizes="(min-width: 1024px) 420px, 100vw"
            className="object-cover"
          />
        </span>
      )}
    </div>
  );

  return (
    <section
      id={block.anchor ?? undefined}
      className="scroll-mt-24 bg-surface-soft text-foreground"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 sm:py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-10 lg:py-28">
        {block.imagePosition === "left" && image}
        <div className={block.imagePosition === "left" ? "" : "lg:order-first"}>
          {block.eyebrow !== null && (
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">
              {block.eyebrow}
            </p>
          )}
          <h2 className="mt-5 text-4xl font-semibold leading-tight text-ivory sm:text-5xl">
            {block.title}
          </h2>
          <div className="mt-8">
            <PayloadRichText data={block.content} />
          </div>
        </div>
        {block.imagePosition === "right" && image}
      </div>
    </section>
  );
}

function CtaPageBlock({
  block,
}: {
  block: Extract<PublicPageBlock, { blockType: "cta" }>;
}) {
  return (
    <section
      id={block.anchor ?? undefined}
      className="scroll-mt-24 border-y border-border bg-background"
    >
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-7 px-6 py-16 sm:py-20 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold text-ivory sm:text-4xl">
            {block.title}
          </h2>
          {block.description !== null && (
            <p className="mt-4 text-base leading-7 text-muted">
              {block.description}
            </p>
          )}
        </div>
        <ActionLink action={block.action} primary />
      </div>
    </section>
  );
}

export default function PageBlocks({
  blocks,
}: {
  blocks: PublicPageBlock[];
}) {
  return blocks
    .filter((block) => block.visible)
    .map((block) => {
      switch (block.blockType) {
        case "hero":
          return <HeroPageBlock key={block.id} block={block} />;
        case "richText":
          return <RichTextPageBlock key={block.id} block={block} />;
        case "cardGroup":
          return <CardGroupPageBlock key={block.id} block={block} />;
        case "imageText":
          return <ImageTextPageBlock key={block.id} block={block} />;
        case "cta":
          return <CtaPageBlock key={block.id} block={block} />;
      }
    });
}
