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
