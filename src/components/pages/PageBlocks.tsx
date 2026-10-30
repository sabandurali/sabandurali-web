import PayloadRichText from "@/components/articles/PayloadRichText";
import {
  altLanguageAttribute,
  creditFromText,
  PublicationImage,
} from "@/components/pages/publication-media";
import { ButtonLink } from "@/components/ui/Button";
import { cardGrids } from "@/components/pages/card-grid";
import Card from "@/components/ui/Card";
import { cx } from "@/components/ui/cx";
import { Credit, Figure } from "@/components/ui/Figure";
import Section from "@/components/ui/Section";
import type { UiLocale } from "@/components/ui/strings";
import Eyebrow from "@/components/ui/Eyebrow";
import TitleLines from "@/components/ui/TitleLines";
import type {
  PublicPageBlock,
  PublicPageImage,
  PublicPageLink,
} from "@/content/pages/public-types";

type BlockOf<T extends PublicPageBlock["blockType"]> = Extract<
  PublicPageBlock,
  { blockType: T }
>;

type BlockProps<T extends PublicPageBlock["blockType"]> = {
  block: BlockOf<T>;
  locale: UiLocale;
};

/** Heading id of a block section, for aria-labelledby. */
function headingId(block: PublicPageBlock): string {
  return `block-${block.id}-heading`;
}

/** An editor's call to action; it opens in the same tab, like every link. */
function ActionLink({
  action,
  variant,
}: {
  action: PublicPageLink;
  variant: "primary" | "secondary" | "on-sea";
}) {
  return (
    <ButtonLink href={action.href} variant={variant}>
      {action.label}
    </ButtonLink>
  );
}

function BlockImage({
  image,
  locale,
  sizes,
  fill = false,
  className,
}: {
  image: PublicPageImage;
  locale: UiLocale;
  sizes: string;
  fill?: boolean;
  className?: string;
}) {
  return (
    <PublicationImage
      src={image.src}
      alt={image.alt}
      {...altLanguageAttribute(image.altLanguage, locale)}
      width={image.width}
      height={image.height}
      layout={fill ? "fill" : "intrinsic"}
      sizes={sizes}
      className={className}
    />
  );
}

/**
 * Hero of a standard page. It carries the page's h1 when it opens the page
 * (`isPageTitle`); a later hero is a section with an h2.
 */
function HeroPageBlock({
  block,
  isPageTitle,
}: BlockProps<"hero"> & { isPageTitle: boolean }) {
  const Heading = isPageTitle ? "h1" : "h2";

  return (
    <Section
      id={block.anchor ?? undefined}
      labelledBy={headingId(block)}
      tone="paper"
      spacing="none"
      className="scroll-mt-24 pt-10 pb-section sm:pt-14"
    >
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.6fr)] lg:items-end lg:gap-16">
        <div className="flex min-w-0 flex-col gap-5">
          {block.eyebrow !== null ? <Eyebrow>{block.eyebrow}</Eyebrow> : null}
          <Heading
            id={headingId(block)}
            className="m-0 max-w-[20ch] type-display break-words"
          >
            <TitleLines lines={block.titleLines} />
          </Heading>
          <p className="m-0 max-w-measure type-lead">{block.description}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <ActionLink action={block.primaryAction} variant="primary" />
            <ActionLink action={block.secondaryAction} variant="secondary" />
          </div>
        </div>

        {block.highlights.length > 0 ? (
          <dl className="m-0 grid border-t-2 border-ink">
            {block.highlights.map((highlight) => (
              <div
                key={`${highlight.value}-${highlight.label}`}
                className="flex flex-col-reverse gap-1 border-b border-hairline py-4"
              >
                <dt className="type-small text-ink-muted">{highlight.label}</dt>
                <dd className="m-0 type-data-lg font-bold">
                  {highlight.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </Section>
  );
}

function BlockHeading({
  block,
  eyebrow,
  title,
}: {
  block: PublicPageBlock;
  eyebrow: string | null;
  title: string;
}) {
  return (
    <div className="mb-8 flex max-w-measure flex-col gap-4">
      {eyebrow !== null ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 id={headingId(block)} className="m-0 type-h2-lg">
        {title}
      </h2>
    </div>
  );
}

function RichTextPageBlock({ block, locale }: BlockProps<"richText">) {
  return (
    <Section
      id={block.anchor ?? undefined}
      labelledBy={block.title === null ? undefined : headingId(block)}
      tone="paper"
      spacing="compact"
      divider
      className="scroll-mt-24"
    >
      <div className="max-w-measure">
        {block.title !== null ? (
          <BlockHeading
            block={block}
            eyebrow={block.eyebrow}
            title={block.title}
          />
        ) : block.eyebrow !== null ? (
          <Eyebrow className="mb-6">{block.eyebrow}</Eyebrow>
        ) : null}
        <PayloadRichText data={block.content} locale={locale} />
      </div>
    </Section>
  );
}

function CardGroupPageBlock({ block, locale }: BlockProps<"cardGroup">) {
  const grid = cardGrids[3];

  return (
    <Section
      id={block.anchor ?? undefined}
      labelledBy={headingId(block)}
      tone="band"
      spacing="compact"
      divider
      className="scroll-mt-24"
    >
      <BlockHeading block={block} eyebrow={block.eyebrow} title={block.title} />
      <ul className={grid.className}>
        {block.cards.map((card) => {
          const media =
            card.image === null ? undefined : (
              <BlockImage
                image={card.image}
                locale={locale}
                sizes={grid.sizes}
                fill
                className="object-cover"
              />
            );
          const credit =
            card.image === null ? null : creditFromText(card.image.credit);
          const description = (
            <p className="m-0 type-small text-ink-muted">{card.description}</p>
          );

          return (
            <li key={card.id} className="grid">
              {/* One Card shell: without a link it draws the same frame,
                  media and body with a plain-text title. */}
              <Card
                title={card.title}
                href={card.link?.href}
                media={media}
                credit={
                  credit === null ? undefined : (
                    <Credit credit={credit} locale={locale} />
                  )
                }
                cta={card.link?.label}
              >
                {description}
              </Card>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function ImageTextPageBlock({ block, locale }: BlockProps<"imageText">) {
  const figure = (
    <Figure
      caption={block.image.caption}
      credit={creditFromText(block.image.credit)}
      locale={locale}
    >
      <BlockImage
        image={block.image}
        locale={locale}
        sizes="(min-width: 1024px) 40vw, 100vw"
        className="rounded-card border border-ink"
      />
    </Figure>
  );

  return (
    <Section
      id={block.anchor ?? undefined}
      labelledBy={headingId(block)}
      tone="paper"
      spacing="compact"
      divider
      className="scroll-mt-24"
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
        <div
          className={cx(
            "min-w-0",
            block.imagePosition === "left" && "lg:order-2",
          )}
        >
          <BlockHeading
            block={block}
            eyebrow={block.eyebrow}
            title={block.title}
          />
          <PayloadRichText data={block.content} locale={locale} />
        </div>
        <div
          className={cx(
            "min-w-0",
            block.imagePosition === "left" && "lg:order-1",
          )}
        >
          {figure}
        </div>
      </div>
    </Section>
  );
}

function CtaPageBlock({ block }: BlockProps<"cta">) {
  return (
    <Section
      id={block.anchor ?? undefined}
      labelledBy={headingId(block)}
      tone="sea"
      spacing="compact"
      className="scroll-mt-24"
    >
      <div className="flex flex-col items-start gap-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-measure">
          <h2 id={headingId(block)} className="m-0 type-h2">
            {block.title}
          </h2>
          {block.description !== null ? (
            <p className="mt-4 mb-0 type-body text-on-sea-soft">
              {block.description}
            </p>
          ) : null}
        </div>
        <ActionLink action={block.action} variant="on-sea" />
      </div>
    </Section>
  );
}

/** Visible blocks of a standard page, in order. */
export function getVisibleBlocks(
  blocks: readonly PublicPageBlock[],
): PublicPageBlock[] {
  return blocks.filter(
    (block) =>
      block.visible &&
      block.blockType !== "homeAbout" &&
      block.blockType !== "homeFocusAreas",
  );
}

/**
 * True when the page opens with a hero block, which then carries the
 * page's h1; otherwise the page renders its own title first.
 */
export function opensWithHero(blocks: readonly PublicPageBlock[]): boolean {
  return getVisibleBlocks(blocks)[0]?.blockType === "hero";
}

/**
 * The blocks of a standard page in the atlas design. Home-only blocks
 * (homeAbout, homeFocusAreas) have no place on a standard page and are
 * skipped.
 */
export default function PageBlocks({
  blocks,
  locale = "tr",
}: {
  blocks: readonly PublicPageBlock[];
  locale?: UiLocale;
}) {
  const visible = getVisibleBlocks(blocks);

  return visible.map((block, index) => {
    switch (block.blockType) {
      case "hero":
        return (
          <HeroPageBlock
            key={block.id}
            block={block}
            locale={locale}
            isPageTitle={index === 0}
          />
        );
      case "richText":
        return (
          <RichTextPageBlock key={block.id} block={block} locale={locale} />
        );
      case "cardGroup":
        return (
          <CardGroupPageBlock key={block.id} block={block} locale={locale} />
        );
      case "imageText":
        return (
          <ImageTextPageBlock key={block.id} block={block} locale={locale} />
        );
      case "cta":
        return <CtaPageBlock key={block.id} block={block} locale={locale} />;
      case "homeAbout":
      case "homeFocusAreas":
        return null;
    }
  });
}
