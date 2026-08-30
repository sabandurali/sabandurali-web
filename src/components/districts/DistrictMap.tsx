import type { District } from "@/content/districts/district-registry";

type DistrictMapProps = { district: District };

/**
 * Sınır/mahalle geometrisi projede bulunmadığından bu bileşen tahmini polygon
 * çizmez. İBB Şehir Haritası, doğrulanmış katmanla görüntülemek için resmi
 * başvuru noktasıdır; güvenilir GeoJSON/WFS sağlanınca bu bileşene eklenir.
 */
export default function DistrictMap({ district }: DistrictMapProps) {
  const [latitude, longitude] = district.center;
  const mapUrl = `https://sehirharitasi.ibb.gov.tr/`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=12/${latitude}/${longitude}`;

  return (
    <section aria-labelledby="district-map-heading" className="border border-border bg-surface p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-soft">Harita</p>
          <h2 id="district-map-heading" className="mt-2 text-3xl text-ivory">{district.name} nerede?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">İlçe ve mahalle sınırlarını tahmin ederek göstermiyoruz. Doğrulanmış mahalle geometrisi projeye henüz eklenmediği için katman kontrollü olarak kapalıdır.</p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href={mapUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center border border-accent px-4 font-semibold text-accent-soft hover:border-accent-soft hover:text-ivory">İBB Şehir Haritası’nda aç <span aria-hidden="true">↗</span></a>
          <a href={osmUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center border border-border px-4 text-muted hover:text-ivory">Konumu aç <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </section>
  );
}
