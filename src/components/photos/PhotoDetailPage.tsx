import MetaList from "@/components/pages/MetaList";
import PageIntro from "@/components/pages/PageIntro";
import PublicationShell from "@/components/pages/PublicationShell";
import { publicationCopy } from "@/components/pages/publication-copy";
import { PublicationImage } from "@/components/pages/publication-media";
import TranslationLink from "@/components/pages/TranslationLink";
import PhotoCard from "@/components/photos/PhotoCard";
import {
  getPhotoCredit,
  getPhotoExif,
  getPhotoFacts,
} from "@/components/photos/photo-details";
import Chip from "@/components/ui/Chip";
import Container from "@/components/ui/Container";
import { Figure } from "@/components/ui/Figure";
import Section from "@/components/ui/Section";
import TextLink from "@/components/ui/TextLink";
import {
  getPhotoLanguagePaths,
  photoListPaths,
} from "@/content/photos/photo-routes";
import type {
  PublicPhoto,
  PublicPhotoTranslation,
} from "@/content/photos/types";

/**
 * Photograph page: intro, the photograph whole (never cropped) with its
 * credit, the facts, tags and camera details, then related photographs.
 */
export default function PhotoDetailPage({
  photo,
  translation,
  related,
}: {
  photo: PublicPhoto;
  translation: PublicPhotoTranslation | null;
  related: PublicPhoto[];
}) {
  const locale = photo.language;
  const copy = publicationCopy[locale];
  const text = copy.photos;
  const languagePaths = getPhotoLanguagePaths(photo, translation);
  const collections = photo.collections.map((item) => item.title).join(" · ");
  const exif = getPhotoExif(photo);

  return (
    <PublicationShell locale={locale} languageHrefs={languagePaths}>
      <article aria-labelledby="photo-title">
        <PageIntro
          locale={locale}
          breadcrumb={[
            { label: copy.home, href: copy.homePath },
            { label: copy.allPhotos, href: photoListPaths[locale] },
            { label: photo.title },
          ]}
          eyebrow={collections === "" ? undefined : collections}
          title={photo.title}
          titleId="photo-title"
          lead={photo.description}
        >
          {translation !== null ? (
            <TranslationLink
              href={languagePaths[translation.language]}
              targetLanguage={translation.language}
              label={text.translation}
              labelLanguage={locale === "tr" ? "en" : undefined}
            />
          ) : null}
        </PageIntro>

        <Container className="pb-10 sm:pb-14">
          <Figure credit={getPhotoCredit(photo)} locale={locale}>
            <PublicationImage
              src={photo.image.src}
              alt={photo.image.alt}
              width={photo.image.width}
              height={photo.image.height}
              fit="contain"
              sizes="(min-width: 1440px) 1296px, 100vw"
              preload
              className="max-h-[85vh] rounded-card border border-ink bg-band"
            />
          </Figure>
        </Container>

        <Section
          tone="paper"
          spacing="none"
          divider
          labelledBy="photo-details-heading"
          className="pt-10 pb-section sm:pt-14"
        >
          <h2 id="photo-details-heading" className="m-0 type-h2">
            {text.details}
          </h2>
          <MetaList items={getPhotoFacts(photo)} className="mt-6" />

          {photo.tags.length > 0 ? (
            <div className="mt-8">
              <h3 className="m-0 type-label text-ink-muted">{text.tags}</h3>
              <ul className="mt-2 mb-0 flex list-none flex-wrap gap-2 p-0">
                {photo.tags.map((item) => (
                  <li key={item.id}>
                    <Chip>{item.title}</Chip>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {exif.length > 0 ? (
            <div className="mt-10 max-w-[52rem]">
              <h3 className="m-0 type-h3">{text.exif}</h3>
              <MetaList
                items={exif}
                layout="grid"
                className="mt-5 rounded-card border border-ink bg-land p-5 sm:p-6 lg:grid-cols-3"
              />
            </div>
          ) : null}

          <TextLink
            href={photoListPaths[locale]}
            variant="standalone"
            locale={locale}
            className="mt-10"
          >
            {copy.allPhotos}
          </TextLink>
        </Section>
      </article>

      {related.length > 0 ? (
        <Section
          tone="band"
          spacing="compact"
          divider
          labelledBy="related-photos-heading"
        >
          <h2 id="related-photos-heading" className="m-0 mb-6 type-h2">
            {text.related}
          </h2>
          <ul className="m-0 grid list-none gap-5 p-0 md:grid-cols-2 xl:grid-cols-4">
            {related.map((item) => (
              <li key={item.id} className="grid">
                <PhotoCard photo={item} headingLevel="h3" />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </PublicationShell>
  );
}
