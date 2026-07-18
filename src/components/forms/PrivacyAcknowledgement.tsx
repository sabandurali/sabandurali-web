import Link from "next/link";
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
  requiredLabel: string;
};

export default function PrivacyAcknowledgement({
  id,
  locale,
  content,
  requiredLabel,
}: PrivacyAcknowledgementProps) {
  return (
    <div className="rounded-sm border border-border bg-surface/70 p-5 sm:p-6">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
        <input
          id={id}
          type="checkbox"
          name="privacyAcknowledgement"
          required
          className="mt-1 size-4 shrink-0 accent-[var(--accent)]"
        />
        <span className="text-sm leading-6 text-ivory">
          {content.prefix}
          <Link
            href={privacyPaths[locale]}
            className="text-accent-soft underline decoration-border underline-offset-4 transition-colors hover:text-accent-strong motion-reduce:transition-none"
          >
            {content.linkLabel}
          </Link>
          {content.suffix}
          <span className="ml-2 text-xs text-accent-soft">
            {requiredLabel}
          </span>
        </span>
      </label>
    </div>
  );
}
