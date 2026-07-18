import Image from "next/image";
import Link from "next/link";
import {
  contactEmail,
  contactPaths,
  feedbackPaths,
  privacyPaths,
} from "@/config/site";
import type { FooterContent } from "@/content/homeContent";

type FooterProps = {
  id: string;
  content: FooterContent;
};

export default function Footer({ id, content }: FooterProps) {
  const links = [
    { href: contactPaths[content.locale], label: content.links.contact },
    { href: feedbackPaths[content.locale], label: content.links.feedback },
    { href: privacyPaths[content.locale], label: content.links.privacy },
  ];

  return (
    <footer
      id={id}
      className="scroll-mt-24 border-t border-border bg-background"
    >
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-[0.9fr_1.1fr] md:items-center lg:px-10">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/sd-monogram-light.png"
            alt=""
            width={606}
            height={669}
            className="h-11 w-auto shrink-0 object-contain"
          />
          <div>
            <h3 className="font-serif text-lg font-semibold tracking-[0.14em] text-ivory">
              {content.brandName}
            </h3>
            <p className="mt-1 text-[9px] tracking-[0.16em] text-accent-soft">
              {content.brandTagline}
            </p>
          </div>
        </div>

        <div>
          <p className="max-w-xl text-sm leading-6 text-muted">
            {content.description}
          </p>
          <p className="mt-4 text-xs text-muted">
            {content.copyright}
          </p>
          <nav
            aria-label={content.locale === "tr" ? "Alt bilgi" : "Footer"}
            className="mt-3 flex flex-wrap gap-x-5 gap-y-1"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex min-h-11 items-center text-xs text-accent-soft underline decoration-border underline-offset-4 transition-colors hover:text-accent-strong motion-reduce:transition-none"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex min-h-11 items-center text-xs text-accent-soft underline decoration-border underline-offset-4 transition-colors hover:text-accent-strong motion-reduce:transition-none"
            >
              {content.links.email}: {contactEmail}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
