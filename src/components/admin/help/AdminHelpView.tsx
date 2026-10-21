import { DefaultTemplate } from "@payloadcms/next/templates";
import { Gutter } from "@payloadcms/ui";
import { redirect } from "next/navigation";
import { formatAdminURL } from "payload/shared";
import type { AdminViewServerProps } from "payload";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { ADMIN_HELP_GUIDE } from "./admin-help-guide";
import styles from "./AdminHelpView.module.css";

const GUIDE_DESCRIPTION =
  "İçerik ekleme, yayınlama ve güvenli yönetim için adım adım rehber.";

function slugifyHeading(value: string): string {
  return value
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ç", "c")
    .replaceAll("ö", "o")
    .replaceAll("ü", "u")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getGuideParts(markdown: string) {
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const sections = Array.from(markdown.matchAll(/^##\s+(\d{1,2}\.\s+.+)$/gm))
    .slice(0, 12)
    .map((match) => ({
      id: slugifyHeading(match[1]),
      title: match[1],
    }));

  if (!titleMatch || sections.length !== 12) {
    throw new Error("Yönetim paneli kılavuzunda başlık ve 12 ana bölüm bulunmalıdır.");
  }

  return {
    body: markdown.replace(/^#\s+.+\r?\n+/, ""),
    sections,
    title: titleMatch[1],
  };
}

const markdownComponents: Components = {
  h2: ({ children }) => {
    const id = slugifyHeading(String(children));

    return (
      <>
        <a className={styles.backToTop} href="#kilavuz-basi">
          Üste dön
        </a>
        <h2 id={id}>{children}</h2>
      </>
    );
  },
};

export async function AdminHelpView({
  initPageResult,
  params,
  searchParams,
}: AdminViewServerProps) {
  const {
    permissions,
    req,
    req: {
      payload: {
        config: {
          admin: { routes: adminRoutes },
          routes: { admin: adminRoute },
        },
      },
      user,
    },
    visibleEntities,
  } = initPageResult;

  if (!user) {
    const loginPath = formatAdminURL({ adminRoute, path: adminRoutes.login });
    redirect(`${loginPath}?redirect=${encodeURIComponent(`${adminRoute}/help`)}`);
  }

  if (!permissions.canAccessAdmin || user.role !== "admin") {
    redirect(formatAdminURL({ adminRoute, path: adminRoutes.unauthorized }));
  }

  const guide = getGuideParts(ADMIN_HELP_GUIDE);

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={user}
      viewType="help"
      visibleEntities={visibleEntities}
    >
      <Gutter>
        <main className={styles.page} id="kilavuz-basi">
          <header className={styles.header}>
            <p className={styles.eyebrow}>Yardım ve Kılavuz</p>
            <h1>{guide.title}</h1>
            <p className={styles.description}>{GUIDE_DESCRIPTION}</p>
          </header>

          <nav aria-labelledby="kilavuz-icerigi" className={styles.toc}>
            <h2 id="kilavuz-icerigi">İçindekiler</h2>
            <ol>
              {guide.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          <article className={styles.content}>
            <Markdown
              components={markdownComponents}
              remarkPlugins={[remarkGfm]}
              skipHtml
            >
              {guide.body}
            </Markdown>
          </article>
        </main>
      </Gutter>
    </DefaultTemplate>
  );
}
