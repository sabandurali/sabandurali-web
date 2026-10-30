import type { ServerProps } from "payload";
import { formatAdminURL } from "payload/shared";
import type { ReactNode } from "react";
import { DISTRICT_FRESHNESS_WARN_DAYS } from "./dashboard-data";
import { loadDashboard, type Row, type Section } from "./dashboard-queries";
import styles from "./EditorDashboard.module.css";

function Card({
  children,
  description,
  empty,
  id,
  section,
  title,
}: {
  children: (rows: Row[]) => ReactNode;
  description: string;
  empty: string;
  id: string;
  section: Section;
  title: string;
}) {
  const headingId = `editor-dashboard-${id}`;
  return (
    <section aria-labelledby={headingId} className={styles.card}>
      <h3 className={styles.cardTitle} id={headingId}>
        {title}
        {"error" in section ? null : (
          <span className={styles.count}> ({section.total})</span>
        )}
      </h3>
      <p className={styles.description}>{description}</p>
      {"error" in section ? (
        <p className={styles.empty}>Bu liste şu anda okunamadı.</p>
      ) : section.rows.length === 0 ? (
        <p className={styles.empty}>{empty}</p>
      ) : (
        children(section.rows)
      )}
      {"error" in section || section.total <= section.rows.length ? null : (
        <p className={styles.more}>
          İlk {section.rows.length} kayıt gösteriliyor.
        </p>
      )}
    </section>
  );
}

/**
 * Editor overview above the collection cards: drafts, scheduled records,
 * missing English versions, media without alt text or credit, and district
 * data that leaves the site within 30 days. Every read uses the signed-in
 * user's access (`overrideAccess: false`).
 */
export async function EditorDashboard({ payload, user }: ServerProps) {
  if (!user) return null;

  const adminRoute = payload.config.routes.admin;
  const editUrl = (row: Row) =>
    formatAdminURL({
      adminRoute,
      path: `/collections/${row.collection}/${row.id}`,
    });
  const data = await loadDashboard({ payload, user }, new Date());

  const list = (rows: Row[]) => (
    <ul className={styles.list}>
      {rows.map((row) => (
        <li key={`${row.collection}-${row.id}`}>
          <a className={styles.link} href={editUrl(row)}>
            {row.title}
          </a>
          {row.kind === undefined && row.detail === undefined ? null : (
            <span className={styles.meta}>
              {[row.kind, row.detail]
                .filter((part) => part !== undefined)
                .join(" · ")}
            </span>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <section
      aria-labelledby="editor-dashboard-title"
      className={styles.dashboard}
    >
      <h2 className={styles.title} id="editor-dashboard-title">
        Editör özeti
      </h2>
      <div className={styles.grid}>
        <Card
          description="Hiç yayımlanmamış veya yayından kaldırılmış kayıtlar; son düzenlenen önce."
          empty="Taslakta bekleyen kayıt yok."
          id="drafts"
          section={data.drafts}
          title="Taslaklar"
        >
          {list}
        </Card>
        <Card
          description="Yayınlanmış, fakat yayın tarihi gelmediği için sitede henüz görünmeyen kayıtlar."
          empty="Planlanmış yayın yok."
          id="scheduled"
          section={data.scheduled}
          title="Planlanan yayınlar"
        >
          {list}
        </Card>
        <Card
          description="Yayındaki makale ve fotoğraflardan İngilizce başlığı, slug’ı, özeti veya alternatif metni eksik olanlar ile İngilizce metni Türkçe metni karşılamayan makaleler; bunlar /en sayfalarında görünmez."
          empty="İngilizce alanı eksik yayında kayıt yok."
          id="missing-english"
          section={data.missingEnglish}
          title="İngilizce eksikleri"
        >
          {list}
        </Card>
        <Card
          description="Alternatif metni veya kaynak / telif bilgisi boş medya. Atıf isteyen görsellerde kaynak satırı zorunludur."
          empty="Alternatif metni ve kaynak bilgisi eksik medya yok."
          id="media"
          section={data.media}
          title="Eksik medya bilgisi"
        >
          {list}
        </Card>
        <Card
          description={`Yayındaki ilçe rehberlerinden, tarihli bir kaynağın veya verinin süresi ${DISTRICT_FRESHNESS_WARN_DAYS} gün içinde dolduğu için sitede gizlenecek bölümler.`}
          empty={`Önümüzdeki ${DISTRICT_FRESHNESS_WARN_DAYS} gün içinde süresi dolan ilçe verisi yok.`}
          id="districts"
          section={data.districts}
          title="Süresi dolacak ilçe verileri"
        >
          {list}
        </Card>
      </div>
    </section>
  );
}
