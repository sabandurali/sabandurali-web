import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_HELP_GUIDE } from "./admin-help-guide";
import { getGuideParts, slugifyHeading } from "./admin-help-guide-parts";

test("the guide has its title and thirteen consecutively numbered sections", () => {
  const parts = getGuideParts(ADMIN_HELP_GUIDE);
  assert.equal(parts.title, "Yönetim Paneli Kullanım Kılavuzu");
  assert.deepEqual(
    parts.sections.map((section) => Number.parseInt(section.title, 10)),
    Array.from({ length: 13 }, (_, index) => index + 1),
  );
  assert.equal(
    new Set(parts.sections.map((section) => section.id)).size,
    parts.sections.length,
  );
  assert.ok(!parts.body.startsWith("# "));
});

test("ARC-14: the guide covers the district guide workflow", () => {
  const parts = getGuideParts(ADMIN_HELP_GUIDE);
  assert.ok(
    parts.sections.some((section) => section.id === "8-ilce-rehberleri"),
  );
  for (const label of [
    "İlçe Rehberleri",
    "Kaynaklar ve doğrulama",
    "Editoryal incelemesi tamamlanan bölümler",
    "Public dışı araştırma notları",
    "Aktarım kaydı",
  ]) {
    assert.ok(ADMIN_HELP_GUIDE.includes(label), label);
  }
});

test("COR-V2: the guide says the English header is managed in code", () => {
  assert.match(ADMIN_HELP_GUIDE, /İngilizce Header menüsü kodda yönetilir/);
  assert.ok(!ADMIN_HELP_GUIDE.includes("/en/feedback"));
});

test("anchors are ASCII slugs of Turkish headings", () => {
  assert.equal(slugifyHeading("8. İlçe rehberleri"), "8-ilce-rehberleri");
  assert.equal(
    slugifyHeading("1. Admin’e giriş ve genel güvenlik"),
    "1-admin-e-giris-ve-genel-guvenlik",
  );
  assert.equal(slugifyHeading("ÇĞİÖŞÜ çğıöşü"), "cgiosu-cgiosu");
});

test("a guide without a title or with misnumbered sections is rejected", () => {
  for (const markdown of [
    "## 1. Bir\n",
    "# Başlık\n\nMetin\n",
    "# Başlık\n\n## 1. Bir\n\n## 3. Üç\n",
    "# Başlık\n\n## 2. İki\n",
  ]) {
    assert.throws(() => getGuideParts(markdown), /sırayla numaralanmış/);
  }
  assert.deepEqual(getGuideParts("# Başlık\n\n## 1. Bir\n\n## Ek\n"), {
    body: "## 1. Bir\n\n## Ek\n",
    sections: [{ id: "1-bir", title: "1. Bir" }],
    title: "Başlık",
  });
});

test("Phase B: the guide states the CMS rules the code enforces", () => {
  for (const statement of [
    // Upload limit and image processing (payload.config.ts, Media.ts).
    "4 MiB",
    "3200",
    "EXIF",
    // Media files are public by URL.
    "adresini bilen herkes",
    // Users: default role, last admin, no password reset email.
    "varsayılan rolü `Editor`",
    "Son `Admin` hesabı silinemez ve `Editor` rolüne düşürülemez",
    "Parola sıfırlama e-postası henüz yapılandırılmamıştır",
    // The footer always keeps the privacy notice and contact links.
    "`KVKK Aydınlatma Metni` ve `İletişim`",
    // Legacy home slug redirect.
    "/ana-sayfa adresi (yalnız bir yönlendirme, sayfa değil) kalıcı olarak `/` adresine yönlenir",
    // English standard pages cannot be published.
    "EN standart `Sayfa` kaydı yayınlanamaz",
    // District news need an https source.
    "`https://` ile başlayan `Orijinal haber URL'si`",
    // Supported internal link targets (INTERNAL_LINK_COLLECTIONS).
    "`Makaleler & Araştırmalar`, `Sayfalar`, `Kitap İncelemeleri`, `Fotoğraflar` ve `İlçe Rehberleri` kayıtlarına",
    // Social image recommendation.
    "1200 × 630",
    // Empty district guides stay out of search.
    "`noindex, follow`",
  ]) {
    assert.ok(ADMIN_HELP_GUIDE.includes(statement), statement);
  }
});

test("Phase B: superseded statements do not come back", () => {
  for (const stale of [
    "10 MiB",
    "`Media`, `Kitap İncelemeleri` ve `Sayfalar` kayıtlarını `Admin` veya `Editor` silebilir",
    "`Admin` veya `Editor` tarafından silinebilir",
    "Canonical alanı yalnız kitap incelemesinde",
  ]) {
    assert.ok(!ADMIN_HELP_GUIDE.includes(stale), stale);
  }
});
