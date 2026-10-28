export type AdminHelpGuideSection = { id: string; title: string };

export type AdminHelpGuideParts = {
  body: string;
  sections: AdminHelpGuideSection[];
  title: string;
};

export function slugifyHeading(value: string): string {
  return value
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ç", "c")
    .replaceAll("ö", "o")
    .replaceAll("ü", "u")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Splits the guide into its title, the numbered main sections that form the
 * table of contents, and the body. The sections must be numbered 1, 2, 3, …
 * without gaps and produce unique anchors.
 */
export function getGuideParts(markdown: string): AdminHelpGuideParts {
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  const sections = Array.from(
    markdown.matchAll(/^##\s+(\d{1,2}\.\s+.+)$/gm),
  ).map((match) => ({
    id: slugifyHeading(match[1]),
    title: match[1],
  }));
  const numbered = sections.every(
    (section, index) => Number.parseInt(section.title, 10) === index + 1,
  );
  const uniqueIds =
    new Set(sections.map((section) => section.id)).size === sections.length;

  if (!titleMatch || sections.length === 0 || !numbered || !uniqueIds) {
    throw new Error(
      "Yönetim paneli kılavuzunda bir başlık ve 1’den başlayarak sırayla numaralanmış ana bölümler bulunmalıdır.",
    );
  }

  return {
    body: markdown.replace(/^#\s+.+\r?\n+/, ""),
    sections,
    title: titleMatch[1],
  };
}
