import type { FooterContent } from "@/content/homeContent";
import { getFooterNavigation } from "@/content/navigation/navigation-data-source";
import Container from "@/components/ui/Container";
import { ArrowUpRightIcon } from "@/components/ui/icons";
import { getUiStrings } from "@/components/ui/strings";
import UiLink from "@/components/ui/UiLink";
import VisuallyHidden from "@/components/ui/VisuallyHidden";
import { withCurrentYear } from "./copyright";
import { getFooterLinkGroups } from "./footer-links";
import Wordmark from "./Wordmark";

type FooterProps = {
  /** Anchor of the footer (home pages link to it as the contact section). */
  id?: string;
  content: FooterContent;
};

const footerLinkClassName =
  "inline-flex min-h-tap items-center gap-1 text-on-sea underline decoration-signal decoration-2 underline-offset-[5px] hover:decoration-[3px]";

/**
 * Sea-ground footer: wordmark, the platform line, the footer navigation and
 * the copyright. The privacy notice (KVKK) and contact links are always
 * present: getFooterNavigation adds them when the CMS footer lacks them.
 * On sea the focus indicator flips to a white ring on a sea halo.
 */
export default async function Footer({ id, content }: FooterProps) {
  const groups = getFooterLinkGroups(await getFooterNavigation(content));
  const strings = getUiStrings(content.locale);

  return (
    <footer
      id={id}
      className="scroll-mt-24 bg-sea text-on-sea scheme-dark [--focus-halo:var(--color-sea)] [--focus-ring:var(--color-on-sea)]"
    >
      <Container className="grid gap-10 py-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12 md:py-16">
        <div>
          <Wordmark
            locale={content.locale}
            name={content.brandName}
            tagline={content.brandTagline}
            tone="on-sea"
            asLink={false}
          />
          <p className="mt-5 mb-0 max-w-[44ch] type-small text-on-sea-soft">
            {content.description}
          </p>
        </div>

        <nav
          aria-label={content.locale === "tr" ? "Alt bilgi" : "Footer"}
          className="grid content-start gap-8 [grid-template-columns:repeat(auto-fit,minmax(min(16rem,100%),1fr))]"
        >
          {groups.map((group) => (
            <div key={group.id}>
              {group.title !== null ? (
                <p
                  id={`footer-group-${group.id}`}
                  className="m-0 mb-2 type-label text-on-sea-muted"
                >
                  {group.title}
                </p>
              ) : null}
              <ul
                aria-labelledby={
                  group.title !== null ? `footer-group-${group.id}` : undefined
                }
                className="m-0 grid list-none gap-1 p-0"
              >
                {group.links.map((link) => (
                  <li key={link.id}>
                    <UiLink
                      href={link.href}
                      newTab={link.newTab}
                      className={footerLinkClassName}
                    >
                      <span className="min-w-0 break-words">{link.label}</span>
                      {link.newTab ? (
                        <>
                          <ArrowUpRightIcon size={14} className="shrink-0" />
                          <VisuallyHidden> {strings.newTab}</VisuallyHidden>
                        </>
                      ) : null}
                    </UiLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </Container>
      <div className="border-t border-sea-line">
        <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5">
          <p className="m-0 type-caption text-on-sea-muted">
            {withCurrentYear(content.copyright, new Date())}
          </p>
        </Container>
      </div>
    </footer>
  );
}
