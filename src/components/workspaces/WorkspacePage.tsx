import type { ReactNode } from "react";
import {
  ArticleCardList,
  PhotoCardList,
} from "@/components/pages/PublicationCardLists";
import { homeCrumb, type BreadcrumbItem } from "@/components/ui/Breadcrumb";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Section from "@/components/ui/Section";
import TextLink from "@/components/ui/TextLink";
import { articleListPaths } from "@/content/articles/article-routes";
import { photoListPaths } from "@/content/photos/photo-routes";
import type { Workspace, WorkspaceEntry } from "@/content/workspaces";
import { workspacePath } from "@/content/workspaces";
import PageIntro from "@/components/ui/PageIntro";
import PageShell from "./PageShell";
import WorkspaceIndexList from "./WorkspaceIndexList";
import type { WorkspaceEntryFeed } from "./workspace-section-route";
import { getListedWorkspaceEntries } from "./workspace-routes";

export {
  createWorkspaceMetadata,
  getListedWorkspaceEntries,
} from "./workspace-routes";

const indexTitle = "Çalışma Alanları";

function workspaceBreadcrumb(
  workspace?: Workspace,
  entry?: WorkspaceEntry,
): BreadcrumbItem[] {
  const trail: BreadcrumbItem[] = [
    homeCrumb("tr"),
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
      <main id="main" className="scheme-light bg-paper text-ink">
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
        <WorkspaceIndexList />
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
              <ArticleCardList articles={articles} locale="tr" />
            </Section>
          ) : null}
          {photos.length > 0 ? (
            <Section labelledBy="section-photos" divider>
              <h2 id="section-photos" className="m-0 mb-8 type-h2">
                Fotoğraflar
              </h2>
              <PhotoCardList photos={photos} />
            </Section>
          ) : null}
        </>
      )}
    </WorkspaceShell>
  );
}
