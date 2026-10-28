import type { DistrictGuide } from "@/content/districts/district-guide-projection";

export default function DistrictFactContext({
  district,
  guide,
}: {
  district: string;
  guide: DistrictGuide | null;
}) {
  return (
    <div className="my-6 text-sm leading-7">
      <p>
        Nüfus veri yılı: {guide?.facts?.populationYear ?? "Belirtilmemiş"}.
        Kaynak veri/gözlem tarihi, kaynağın son kontrolü ve rehberin içerik
        güncellemesi farklı tarihlerdir. Kaynak yayın tarihi ayrıca
        doğrulanmadıkça veri/gözlem tarihi yayın tarihi sayılmaz.
      </p>
      {district === "kadikoy" && (
        <p className="mt-2">
          2025 ADNKS nüfusu: 458.573.{" "}
          <a
            className="underline"
            href="https://www.kadikoyakademi.org/kadikoyun-demografik-donusumu-devam-ediyor/"
          >
            Kadıköy Belediyesi Akademi
          </a>{" "}
          aktarımı 18 Ekim 2026’da kontrol edildi; yayın tarihi doğrulanamadı.
          Kaymakamlığın 451.453 kişilik kaydı 2017 verisidir ve 2025 nüfusunun
          yerine kullanılmaz.
        </p>
      )}
      <a href="#kaynaklar" className="underline">
        Veri kaynakları ve kontrol tarihleri →
      </a>
    </div>
  );
}
