import { contactPaths } from "@/config/site";
import { articleListPaths } from "@/content/articles/article-routes";
import { districtGuidePath } from "@/content/districts/district-routes";
import { homeContent } from "@/content/homeContent";
import { ButtonLink } from "@/components/ui/Button";
import TextLink from "@/components/ui/TextLink";
import Footer from "./Footer";
import Header from "./Header";
import { localeHomePaths, type HeaderLocale } from "./header-content";
import StatusMessage from "./StatusMessage";

type Destination = { href: string; label: string };

const texts: Record<
  HeaderLocale,
  {
    title: string;
    body: string;
    home: string;
    elsewhere: string;
    destinations: Destination[];
  }
> = {
  tr: {
    title: "Aradığınız sayfa bulunamadı.",
    body: "Bu içerik yayından kaldırılmış, adresi değişmiş ya da hiç yayımlanmamış olabilir.",
    home: "Ana sayfaya dön",
    elsewhere: "Şunlara da bakabilirsiniz",
    destinations: [
      { href: districtGuidePath, label: "İstanbul İlçe Rehberi" },
      { href: articleListPaths.tr, label: "Makaleler" },
      { href: contactPaths.tr, label: "İletişim" },
    ],
  },
  en: {
    title: "The page you requested was not found.",
    body: "It may have been unpublished, moved to a different address or never published.",
    home: "Return to the home page",
    elsewhere: "You may also look at",
    destinations: [
      { href: articleListPaths.en, label: "Articles" },
      { href: contactPaths.en, label: "Contact" },
    ],
  },
};

/**
 * 404 inside a public route group: the full header and footer (so every
 * section stays one step away), and a plain explanation with a way home.
 * Next.js adds `noindex` to every 404 response.
 */
export default function NotFoundScreen({ locale }: { locale: HeaderLocale }) {
  const t = texts[locale];
  const home = homeContent[locale];
  const listId = `not-found-elsewhere-${locale}`;

  return (
    <div id="top" lang={locale}>
      <Header
        locale={locale}
        languageHrefs={{ tr: localeHomePaths.tr, en: localeHomePaths.en }}
      />
      <StatusMessage
        code="404"
        title={t.title}
        actions={
          <ButtonLink href={localeHomePaths[locale]}>{t.home}</ButtonLink>
        }
        aside={
          <>
            <h2 id={listId} className="m-0 type-h4">
              {t.elsewhere}
            </h2>
            <ul
              aria-labelledby={listId}
              className="m-0 mt-2 grid list-none gap-0.5 p-0"
            >
              {t.destinations.map((destination) => (
                <li key={destination.href}>
                  <TextLink
                    href={destination.href}
                    variant="standalone"
                    locale={locale}
                  >
                    {destination.label}
                  </TextLink>
                </li>
              ))}
            </ul>
          </>
        }
      >
        <p className="m-0">{t.body}</p>
      </StatusMessage>
      <Footer id={home.anchors.contact} content={home.footer} />
    </div>
  );
}
