"use client";

import { useFormFields, useLocale } from "@payloadcms/ui";
import type { UIFieldClientProps } from "payload";
import { useId } from "react";
import {
  buildSeoPreview,
  isSeoPreviewKind,
  SEO_PREVIEW_PATHS,
  type SeoPreviewKind,
} from "./seo-preview";
import styles from "./SeoPreviewField.module.css";

function useFieldValue(path: string | null): unknown {
  return useFormFields(([fields]) =>
    path === null ? undefined : fields[path]?.value,
  );
}

function Counter({
  label,
  length,
  limit,
}: {
  label: string;
  length: number;
  limit: number;
}) {
  const over = length > limit;
  return (
    <p className={over ? `${styles.counter} ${styles.over}` : styles.counter}>
      {label}: {length} / {limit} karakter
      {over ? " — arama sonucunda kısaltılabilir" : ""}
    </p>
  );
}

function Preview({ kind }: { kind: SeoPreviewKind }) {
  const paths = SEO_PREVIEW_PATHS[kind];
  const locale = useLocale();
  const headingId = useId();
  const title = useFieldValue(paths.title);
  const metaTitle = useFieldValue(paths.metaTitle);
  const metaDescription = useFieldValue(paths.metaDescription);
  const canonical = useFieldValue(paths.canonical);
  const socialImage = useFieldValue(paths.socialImage);
  const fallbackPaths: readonly string[] = paths.fallbackDescriptions;
  const firstFallback = useFieldValue(fallbackPaths[0] ?? null);
  const secondFallback = useFieldValue(fallbackPaths[1] ?? null);
  const slug = useFieldValue("slug");
  const language = useFieldValue(kind === "pages" ? "language" : null);
  const pageType = useFieldValue(kind === "pages" ? "pageType" : null);

  const preview = buildSeoPreview(kind, {
    canonical,
    fallbackDescriptions: [firstFallback, secondFallback],
    language,
    locale: locale.code === "en" ? "en" : "tr",
    metaDescription,
    metaTitle,
    pageType,
    slug,
    socialImage,
    title,
  });

  return (
    <section
      aria-labelledby={headingId}
      className={styles.panel}
      data-admin-seo-preview=""
    >
      <h3 className={styles.heading} id={headingId}>
        Arama ve paylaşım önizlemesi
      </h3>
      <p className={styles.intro}>
        Sitedeki etiketlerle aynı kurallarla üretilir. Boş bırakılan SEO
        alanları için kullanılacak metin gösterilir.
      </p>

      <div className={styles.serp}>
        <p className={styles.caption}>Arama sonucu</p>
        <p className={styles.serpUrl}>
          {preview.url ?? "Bu kaydın sitede kendi adresi yok."}
        </p>
        <p className={styles.serpTitle}>
          {preview.title ?? "Başlık girilmedi"}
        </p>
        <p className={styles.serpDescription}>
          {preview.description ?? "Açıklama girilmedi"}
        </p>
      </div>
      <Counter
        label={
          preview.titleFromSeoField
            ? "SEO başlığı"
            : "Başlık (SEO başlığı boş, içerik başlığı kullanılıyor)"
        }
        length={preview.titleLength}
        limit={preview.titleLimit}
      />
      <Counter
        label={
          preview.descriptionFromSeoField
            ? "SEO açıklaması"
            : "Açıklama (SEO açıklaması boş, içerikten üretiliyor)"
        }
        length={preview.descriptionLength}
        limit={preview.descriptionLimit}
      />

      <div className={styles.card}>
        <p className={styles.caption}>Sosyal paylaşım kartı</p>
        <p className={styles.cardDomain}>sabandurali.com</p>
        <p className={styles.cardTitle}>
          {preview.title ?? "Başlık girilmedi"}
        </p>
        <p className={styles.cardDescription}>
          {preview.description ?? "Açıklama girilmedi"}
        </p>
        <p className={styles.cardImage}>{preview.imageNote}</p>
      </div>
    </section>
  );
}

/**
 * Live SEO preview inside the SEO group. `clientProps.kind` names the
 * collection; an unknown kind renders nothing.
 */
export function SeoPreviewField(props: UIFieldClientProps & { kind?: string }) {
  return isSeoPreviewKind(props.kind) ? <Preview kind={props.kind} /> : null;
}
