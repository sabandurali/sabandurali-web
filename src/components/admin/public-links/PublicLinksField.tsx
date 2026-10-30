import type { UIFieldServerComponent } from "payload";
import {
  formatAdminDateTime,
  getPublicRecordLinks,
  getPublicRecordState,
  isPublicRecordCollection,
  type PublicRecordState,
} from "./public-record";
import styles from "./PublicLinksField.module.css";

const localeNames = { en: "İngilizce", tr: "Türkçe" } as const;

function describeState(state: PublicRecordState): {
  badge: string;
  detail: string | null;
  tone: "draft" | "hidden" | "live" | "scheduled";
} {
  switch (state.kind) {
    case "live":
      return {
        badge: "Yayında",
        detail: `Yayın tarihi: ${formatAdminDateTime(state.publishedAt) ?? "—"}`,
        tone: "live",
      };
    case "scheduled":
      return {
        badge: "Planlandı",
        detail: `Sitede görüneceği tarih: ${formatAdminDateTime(state.publishedAt) ?? "—"}`,
        tone: "scheduled",
      };
    case "hidden":
      return {
        badge: "Yayında, sitede gizli",
        detail: state.reason,
        tone: "hidden",
      };
    case "draft":
      return {
        badge: "Taslak",
        detail: "Yayımlanmış bir sürüm yok; kayıt sitede görünmez.",
        tone: "draft",
      };
  }
}

/**
 * Sidebar panel of a record: its public state (published version only) and
 * its addresses on the site. Reads with the editor's own access.
 */
export const PublicLinksField: UIFieldServerComponent = async ({
  collectionSlug,
  id,
  payload,
  req,
}) => {
  if (!isPublicRecordCollection(collectionSlug)) return null;

  if (id === undefined) {
    return (
      <section aria-labelledby="public-links-title" className={styles.panel}>
        <h2 className={styles.title} id="public-links-title">
          Sitede
        </h2>
        <p className={styles.note}>
          Kayıt ilk kez kaydedildikten sonra durumu ve site adresi burada
          görünür.
        </p>
      </section>
    );
  }

  const published = await payload.findByID({
    collection: collectionSlug,
    depth: 0,
    disableErrors: true,
    draft: false,
    id: String(id),
    locale: "all",
    overrideAccess: false,
    req,
  });
  const state = getPublicRecordState(collectionSlug, published, new Date());
  const links = getPublicRecordLinks(collectionSlug, published);
  const { badge, detail, tone } = describeState(state);

  return (
    <section aria-labelledby="public-links-title" className={styles.panel}>
      <h2 className={styles.title} id="public-links-title">
        Sitede
      </h2>
      <p className={styles.status}>
        <span className={styles.label}>Durum:</span>{" "}
        <span className={`${styles.badge} ${styles[tone]}`}>{badge}</span>
      </p>
      {detail === null ? null : <p className={styles.note}>{detail}</p>}
      {links.length === 0 ? (
        <p className={styles.note}>Bu kaydın sitede kendi sayfası yok.</p>
      ) : (
        <ul className={styles.links}>
          {links.map((link) => (
            <li key={link.locale}>
              {state.kind === "live" ? (
                <a
                  className={styles.link}
                  href={link.path}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Sitede aç ({localeNames[link.locale]})
                  <span className={styles.srOnly}> — yeni sekmede açılır</span>
                </a>
              ) : (
                <span className={styles.pending}>
                  {localeNames[link.locale]} adresi (yayından sonra):
                </span>
              )}
              <code className={styles.path}>{link.path}</code>
            </li>
          ))}
        </ul>
      )}
      <p className={styles.hint}>
        Durum, yayımlanmış sürüme göredir; kaydedilmemiş veya yalnız taslak
        olarak kaydedilmiş değişiklikler sitede görünmez.
      </p>
    </section>
  );
};
