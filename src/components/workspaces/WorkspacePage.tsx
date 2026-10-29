import Image from "next/image";
import type { ReactNode } from "react";
import type { BreadcrumbItem } from "@/components/ui/Breadcrumb";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { Credit } from "@/components/ui/Figure";
import Section from "@/components/ui/Section";
import TextLink from "@/components/ui/TextLink";
import { getArticlePath } from "@/content/articles/article-routes";
import type { PublicArticleSummary } from "@/content/articles/public-types";
import { articleListPaths } from "@/content/articles/article-routes";
import { getPhotoPath, photoListPaths } from "@/content/photos/photo-routes";
import type { PublicPhoto } from "@/content/photos/types";
import type { Workspace, WorkspaceEntry } from "@/content/workspaces";
import { workspacePath, workspaces } from "@/content/workspaces";
import { formatDate, toDateTimeAttribute } from "@/lib/format-date";
import PageIntro, { Eyebrow } from "./PageIntro";
import PageShell from "./PageShell";
import type { WorkspaceEntryFeed } from "./workspace-section-route";
import { getListedWorkspaceEntries } from "./workspace-routes";

export {
  createWorkspaceMetadata,
  getListedWorkspaceEntries,
} from "./workspace-routes";

const indexTitle = "Çalışma Alanları";
const cardImageSizes =
  "(min-width: 1280px) 30vw, (min-width: 768px) 45vw, calc(100vw - 2rem)";

function workspaceBreadcrumb(
  workspace?: Workspace,
  entry?: WorkspaceEntry,
): BreadcrumbItem[] {
  const trail: BreadcrumbItem[] = [
    { label: "Ana sayfa", href: "/" },
    { label: indexTitle, href: workspacePath },
    ...(workspace
      ? [{ label: workspace.title, href: `/${workspace.key}` }]
      : []),
    ...(entry ? [{ label: entry.title }] : []),
  ];
  // The last item is the current page and carries no link.
  return trail.map((item, index) =>
    index === trail.length - 1 ? { label: item.label } : item,
  );
}

/** Pages under /calisma-alanlari and the six workspaces: Turkish only. */
function WorkspaceShell({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  return (
    <PageShell locale="tr" languageHrefs={{ tr: path, en: "/en" }}>
      <main id="main" className="bg-paper text-ink">
        {children}
      </main>
    </PageShell>
  );
}

/** `/calisma-alanlari`: the six workspaces and their sections. */
export function WorkspaceIndexPage() {
  return (
    <WorkspaceShell path={workspacePath}>
      <Section spacing="default">
        <PageIntro
          breadcrumb={workspaceBreadcrumb()}
          eyebrow="Platform yapısı"
          title={indexTitle}
          lead="Şaban Durali platformunun altı ana çalışma alanını ve bu alanların yayın girişlerini inceleyin."
        />
      </Section>

      <Section tone="band" labelledBy="workspace-list-title" divider>
        <h2 id="workspace-list-title" className="sr-only">
          Altı çalışma alanı
        </h2>
        <ol className="m-0 grid list-none gap-px overflow-hidden rounded-card border border-ink bg-ink p-0 md:grid-cols-2">
          {workspaces.map((workspace) => (
            <li key={workspace.key} className="flex min-w-0 flex-col bg-land">
              <article
                aria-labelledby={`workspace-${workspace.key}`}
                className="flex flex-auto flex-col gap-3 p-5 sm:p-7"
              >
                <Eyebrow>{workspace.eyebrow}</Eyebrow>
                <h3 id={`workspace-${workspace.key}`} className="m-0 type-h3">
                  <TextLink href={`/${workspace.key}`}>
                    {workspace.title}
                  </TextLink>
                </h3>
                <p className="m-0 type-small text-ink-muted">
                  {workspace.description}
                </p>
                <p className="m-0 mt-2 type-label text-ink-muted">Bölümler</p>
                <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0">
                  {getListedWorkspaceEntries(workspace).map((entry) => (
                    <li key={entry.slug}>
                      <TextLink
                        href={entry.href}
                        className="inline-flex min-h-tap items-center type-small"
                      >
                        {entry.title}
                      </TextLink>
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ol>
      </Section>
    </WorkspaceShell>
  );
}

/** `/<workspace>`: one workspace and its section cards. */
export function WorkspaceLandingPage({
  workspace,
  path,
}: {
  workspace: Workspace;
  path: string;
}) {
  const headingId = `${workspace.key}-sections`;

  return (
    <WorkspaceShell path={path}>
      <Section>
        <PageIntro
          breadcrumb={workspaceBreadcrumb(workspace)}
          eyebrow={workspace.eyebrow}
          title={workspace.title}
          lead={workspace.description}
        />
      </Section>
      <Section tone="band" labelledBy={headingId} divider>
        <h2 id={headingId} className="m-0 mb-8 type-h2">
          Bölümler
        </h2>
        <ul className="m-0 grid list-none gap-5 p-0 md:grid-cols-2 xl:grid-cols-3">
          {getListedWorkspaceEntries(workspace).map((entry) => (
            <li key={entry.slug} className="flex min-w-0">
              <Card
                title={entry.title}
                href={entry.href}
                cta="Bölümü aç"
                className="w-full"
              >
                <p className="m-0 type-small text-ink-muted">
                  {entry.description}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>
    </WorkspaceShell>
  );
}

function ArticleCard({ article }: { article: PublicArticleSummary }) {
  const image = article.featuredImage;
  const date = formatDate(article.publishedAt, "tr");
  const dateTime = toDateTimeAttribute(article.publishedAt);
  const category = article.categories[0]?.name;

  return (
    <Card
      title={article.title}
      href={getArticlePath(article.slug, article.language)}
      headingLevel={3}
      media={
        image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes={cardImageSizes}
            className="object-cover"
          />
        ) : undefined
      }
      credit={
        image?.credit ? (
          <span className="type-caption text-ink-muted">{image.credit}</span>
        ) : undefined
      }
      eyebrow={
        date || category ? (
          <>
            {date && dateTime ? (
              <time dateTime={dateTime} className="type-data">
                {date}
              </time>
            ) : null}
            {category ? <span>{category}</span> : null}
          </>
        ) : undefined
      }
      className="w-full"
    >
      {article.summary ? (
        <p className="m-0 type-small text-ink-muted">{article.summary}</p>
      ) : null}
    </Card>
  );
}

function PhotoCard({ photo }: { photo: PublicPhoto }) {
  const photographer = photo.photographer.trim();
  const licence = photo.creditLicense?.trim() ?? "";
  const collections = photo.collections.map((item) => item.title).join(" · ");

  return (
    <Card
      title={photo.title}
      href={getPhotoPath(photo.slug, photo.language)}
      headingLevel={3}
      media={
        <Image
          src={photo.image.src}
          alt={photo.image.alt}
          fill
          sizes={cardImageSizes}
          className="object-cover"
        />
      }
      credit={
        photographer || licence ? (
          <Credit
            credit={{
              ...(photographer ? { author: photographer } : {}),
              ...(licence ? { licence } : {}),
            }}
          />
        ) : undefined
      }
      eyebrow={collections ? <span>{collections}</span> : undefined}
      className="w-full"
    />
  );
}

/** `/<workspace>/<section>`: the section's published articles and photos. */
export function WorkspaceEntryPage({
  workspace,
  entry,
  feed,
}: {
  workspace: Workspace;
  entry: WorkspaceEntry;
  feed: WorkspaceEntryFeed;
}) {
  const { articles, photos, items } = feed;
  const isEmpty = items === null || items.length === 0;

  return (
    <WorkspaceShell path={entry.href}>
      <Section>
        <PageIntro
          breadcrumb={workspaceBreadcrumb(workspace, entry)}
          eyebrow={workspace.title}
          title={entry.title}
          lead={entry.description}
        />
      </Section>

      {isEmpty ? (
        <Section tone="band" divider>
          <EmptyState
            size="lg"
            note={
              <>
                Diğer yayınlar için{" "}
                <TextLink href={articleListPaths.tr}>Makaleler</TextLink> ve{" "}
                <TextLink href={photoListPaths.tr}>Fotoğraflar</TextLink>{" "}
                sayfalarına bakabilir ya da{" "}
                <TextLink href={`/${workspace.key}`}>
                  {workspace.title}
                </TextLink>{" "}
                alanına dönebilirsiniz.
              </>
            }
          >
            {items === null
              ? "Bu bölüm için yayınlanmış içerik henüz eklenmedi."
              : "Bu başlıkta yayınlanmış içerik henüz eklenmedi."}
          </EmptyState>
        </Section>
      ) : (
        <>
          {articles.length > 0 ? (
            <Section tone="band" labelledBy="section-articles" divider>
              <h2 id="section-articles" className="m-0 mb-8 type-h2">
                Makaleler
              </h2>
              <ul className="m-0 grid list-none gap-5 p-0 md:grid-cols-2 xl:grid-cols-3">
                {articles.map((article) => (
                  <li key={article.id} className="flex min-w-0">
                    <ArticleCard article={article} />
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
          {photos.length > 0 ? (
            <Section labelledBy="section-photos" divider>
              <h2 id="section-photos" className="m-0 mb-8 type-h2">
                Fotoğraflar
              </h2>
              <ul className="m-0 grid list-none gap-5 p-0 md:grid-cols-2 xl:grid-cols-3">
                {photos.map((photo) => (
                  <li key={photo.id} className="flex min-w-0">
                    <PhotoCard photo={photo} />
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </>
      )}
    </WorkspaceShell>
  );
}
