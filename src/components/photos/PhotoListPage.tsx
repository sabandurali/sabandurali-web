import PageIntro from "@/components/ui/PageIntro";
import PublicationShell from "@/components/pages/PublicationShell";
import { publicationCopy } from "@/components/pages/publication-copy";
import PhotoCard from "@/components/photos/PhotoCard";
import { getPhotoListHref } from "@/components/photos/photo-list-params";
import { Button } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { Field, Select } from "@/components/ui/Field";
import Pagination from "@/components/ui/Pagination";
import Section from "@/components/ui/Section";
import TextLink from "@/components/ui/TextLink";
import { photoListPaths } from "@/content/photos/photo-routes";
import type {
  PhotoLanguage,
  PhotoListFilters,
  PublishedPhotoList,
} from "@/content/photos/types";

/**
 * Photograph list: intro, a filter form (collection and tag, sent as a
 * plain GET form so it works without JavaScript), the card grid and page
 * links that keep the filters.
 */
export default function PhotoListPage({
  locale,
  filters,
  result,
}: {
  locale: PhotoLanguage;
  filters: PhotoListFilters;
  result: PublishedPhotoList;
}) {
  const copy = publicationCopy[locale];
  const text = copy.photos;
  const filtered = Boolean(filters.collection || filters.tag);
  const hasFilters = result.collections.length > 0 || result.tags.length > 0;

  return (
    <PublicationShell locale={locale} languageHrefs={photoListPaths}>
      <PageIntro
        layout="page"
        locale={locale}
        breadcrumb={[
          { label: copy.home, href: copy.homePath },
          { label: copy.allPhotos },
        ]}
        eyebrow={text.eyebrow}
        title={text.title}
        lead={text.description}
      >
        {result.totalItems > 0 ? (
          <p className="m-0 type-data-md text-ink-muted">
            {copy.photoCount(result.totalItems)}
            {result.totalPages > 1 ? (
              <> · {text.pageOf(result.page, result.totalPages)}</>
            ) : null}
          </p>
        ) : null}
      </PageIntro>

      <Section
        tone="band"
        spacing="compact"
        divider
        labelledBy="photo-list-heading"
      >
        <h2 id="photo-list-heading" className="m-0 mb-6 type-h2">
          {copy.allPhotos}
        </h2>

        {hasFilters ? (
          <form
            action={photoListPaths[locale]}
            method="get"
            aria-labelledby="photo-filter-heading"
            className="mb-8 grid gap-4 rounded-card border border-ink bg-land p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"
          >
            <h3 id="photo-filter-heading" className="m-0 type-h4 md:col-span-3">
              {text.filtersTitle}
            </h3>
            <Field label={text.collection} locale={locale}>
              {(control) => (
                <Select
                  {...control}
                  name="collection"
                  defaultValue={filters.collection ?? ""}
                >
                  <option value="">{text.all}</option>
                  {result.collections.map((item) => (
                    <option key={item.id} value={item.slug}>
                      {item.title}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label={text.tag} locale={locale}>
              {(control) => (
                <Select
                  {...control}
                  name="tag"
                  defaultValue={filters.tag ?? ""}
                >
                  <option value="">{text.all}</option>
                  {result.tags.map((item) => (
                    <option key={item.id} value={item.slug}>
                      {item.title}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Button type="submit">{text.filter}</Button>
              {filtered ? (
                <TextLink
                  href={photoListPaths[locale]}
                  variant="standalone"
                  locale={locale}
                >
                  {text.clearFilters}
                </TextLink>
              ) : null}
            </div>
          </form>
        ) : null}

        {result.photos.length === 0 ? (
          <EmptyState size="lg">
            {filtered ? text.emptyFiltered : text.empty}
          </EmptyState>
        ) : (
          <ul className="m-0 grid list-none gap-5 p-0 md:grid-cols-2 xl:grid-cols-3">
            {result.photos.map((photo) => (
              <li key={photo.id} className="grid">
                <PhotoCard photo={photo} headingLevel="h3" />
              </li>
            ))}
          </ul>
        )}

        <Pagination
          current={result.page}
          total={result.totalPages}
          getHref={(page) => getPhotoListHref(locale, filters, page)}
          locale={locale}
          className="mt-10"
        />
      </Section>
    </PublicationShell>
  );
}
