import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";

type TranslationLinkProps = {
  href: string;
  /** Language of the translation the link opens. */
  targetLanguage: "tr" | "en";
  /** Visible text; it is also the accessible name (WCAG 2.5.3). */
  label: string;
  /** Language of `label` when it differs from the page ("Read in English"
   * on a Turkish page). */
  labelLanguage?: "tr" | "en";
};

/** Link to the same document in the other language. */
export default function TranslationLink({
  href,
  targetLanguage,
  label,
  labelLanguage,
}: TranslationLinkProps) {
  return (
    <ButtonLink
      href={href}
      hrefLang={targetLanguage === "tr" ? "tr-TR" : "en"}
      variant="secondary"
      size="sm"
      icon={<ArrowRightIcon size={16} />}
      className="self-start"
    >
      <span lang={labelLanguage}>{label}</span>
    </ButtonLink>
  );
}
