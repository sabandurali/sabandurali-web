import { FieldError } from "@/components/ui/Field";
import TextLink from "@/components/ui/TextLink";
import { cx } from "@/components/ui/cx";
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
  /** Validation message; marks the checkbox invalid while present. */
  error?: string;
};

/**
 * Required privacy notice checkbox. The 24 px box and the whole label row
 * are the touch target; the notice link inside stays a separate, underlined
 * link (it opens the notice, it does not tick the box). A validation
 * message sits under the box, tied to it like a `Field` error.
 */
export default function PrivacyAcknowledgement({
  id,
  locale,
  content,
  error,
}: PrivacyAcknowledgementProps) {
  const strings = getUiStrings(locale);
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cx(
          "flex items-start gap-3 rounded-card bg-land px-4 py-3",
          error ? "border-2 border-danger" : "border border-tile-edge",
        )}
      >
        <input
          id={id}
          type="checkbox"
          name="privacyAcknowledgement"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className="mt-0.5 size-6 shrink-0 cursor-pointer accent-[var(--color-ink)]"
        />
        <label
          htmlFor={id}
          className="min-h-tap flex-1 cursor-pointer text-ink"
        >
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
      {error ? (
        <FieldError id={errorId} locale={locale}>
          {error}
        </FieldError>
      ) : null}
    </div>
  );
}
