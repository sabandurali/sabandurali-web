import { ArrowDownIcon, ArrowUpRightIcon } from "@/components/ui/icons";
import { getUiStrings, type UiLocale } from "@/components/ui/strings";
import VisuallyHidden from "@/components/ui/VisuallyHidden";

type DownloadLinkProps = {
  href: string;
  label: string;
  /** "PDF", "XLSX" … shown as a mono tag after the label. */
  fileType?: string;
  fileSize?: string;
  /** Opens in a new tab (a file on another site). */
  newTab?: boolean;
  locale?: UiLocale;
};

/**
 * A file to download (PDF report, data sheet): one full-width row with the
 * file name, its type and size. The whole row is the link; the name is
 * underlined so it reads as one.
 */
export default function DownloadLink({
  href,
  label,
  fileType,
  fileSize,
  newTab = false,
  locale = "tr",
}: DownloadLinkProps) {
  const strings = getUiStrings(locale);
  const details = [fileType, fileSize].filter(Boolean).join(" · ");

  return (
    <a
      href={href}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className="group flex min-h-tap items-center gap-3 rounded-card border border-ink bg-land px-4 py-3 text-ink no-underline transition-colors duration-150 ease-atlas hover:bg-band"
    >
      <span className="min-w-0 flex-auto font-semibold break-words underline decoration-1 underline-offset-[0.2em] group-hover:decoration-2">
        {label}
      </span>
      {details ? (
        <span className="shrink-0 type-data text-ink-muted">{details}</span>
      ) : null}
      {newTab ? (
        <>
          <ArrowUpRightIcon size={18} className="shrink-0" />
          <VisuallyHidden> {strings.newTab}</VisuallyHidden>
        </>
      ) : (
        <ArrowDownIcon size={18} className="shrink-0" />
      )}
    </a>
  );
}
