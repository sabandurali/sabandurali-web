import TextLink from "@/components/ui/TextLink";
import { getUiStrings } from "@/components/ui/strings";
import { privacyPaths } from "@/config/site";
import type { Locale } from "@/content/homeContent";

export type PrivacyAcknowledgementContent = {
  prefix: string;
  linkLabel: string;
  suffix: string;
};

type PrivacyAcknowledgementProps = {
  id: string;
  locale: Locale;
  content: PrivacyAcknowledgementContent;
};

/**
 * Required privacy notice checkbox. The 24 px box and the whole label row
 * are the touch target; the notice link inside stays a separate, underlined
 * link (it opens the notice, it does not tick the box).
 */
export default function PrivacyAcknowledgement({
  id,
  locale,
  content,
}: PrivacyAcknowledgementProps) {
  const strings = getUiStrings(locale);

  return (
    <div className="flex items-start gap-3 rounded-card border border-tile-edge bg-land px-4 py-3">
      <input
        id={id}
        type="checkbox"
        name="privacyAcknowledgement"
        required
        className="mt-0.5 size-6 shrink-0 cursor-pointer accent-[var(--color-ink)]"
      />
      <label htmlFor={id} className="min-h-tap flex-1 cursor-pointer text-ink">
        {content.prefix}
        <TextLink href={privacyPaths[locale]} locale={locale}>
          {content.linkLabel}
        </TextLink>
        {content.suffix}
        <span className="ml-2 type-caption text-ink-muted">
          ({strings.required})
        </span>
      </label>
    </div>
  );
}
