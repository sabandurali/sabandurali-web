import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  aboutPageName,
  contactPageNames,
  createAboutPageJsonLd,
  createContactPageJsonLd,
  createHomeEntityJsonLd,
  createPersonEntity,
  createPersonReference,
  personEntityId,
  personProfileUrls,
  profilePageEntityId,
  serializeJsonLd,
  websiteEntityId,
} from "./entity-seo";

test("the person reference carries @id, name and URL for other pages", () => {
  assert.deepEqual(createPersonReference(), {
    "@type": "Person",
    "@id": personEntityId,
    name: "Şaban Durali",
    url: "https://www.sabandurali.com/",
  });
});

test("the person entity adds image and localized subjects", () => {
  for (const locale of ["tr", "en"] as const) {
    const person = createPersonEntity(locale);

    assert.equal(person["@id"], personEntityId);
    assert.equal(
      person.image,
      "https://www.sabandurali.com/brand/saban-durali-profile.jpg",
    );
    assert.equal(person.knowsAbout.length, 6);
    // sameAs only lists profiles the owner confirmed.
    assert.equal("sameAs" in person, personProfileUrls.length > 0);
  }
  assert.ok(createPersonEntity("tr").knowsAbout.includes("Gayrimenkul"));
  assert.ok(createPersonEntity("en").knowsAbout.includes("Real estate"));
});

test("ENTITY-SEO-CODE: both home pages publish the WebSite and its owner", () => {
  for (const locale of ["tr", "en"] as const) {
    const graph = createHomeEntityJsonLd(locale)["@graph"];
    assert.deepEqual(
      graph.map((node) => node["@type"]),
      ["WebSite", "Person"],
    );
    const [website] = graph;
    assert.equal(website["@id"], websiteEntityId);
    assert.deepEqual(website.publisher, { "@id": personEntityId });
    assert.deepEqual(website.inLanguage, ["tr-TR", "en"]);
  }
  // One WebSite entity: the same node on both home pages.
  assert.deepEqual(
    createHomeEntityJsonLd("tr")["@graph"][0],
    createHomeEntityJsonLd("en")["@graph"][0],
  );
});

test("SITE-SEARCH: the WebSite names the search page of each language", () => {
  const [website] = createHomeEntityJsonLd("tr")["@graph"];
  assert.deepEqual(
    website.potentialAction.map((action) => action.target.urlTemplate),
    [
      "https://www.sabandurali.com/ara?q={search_term_string}",
      "https://www.sabandurali.com/en/search?q={search_term_string}",
    ],
  );
  for (const action of website.potentialAction) {
    assert.equal(action["@type"], "SearchAction");
    assert.equal(action["query-input"], "required name=search_term_string");
  }
});

test("ENTITY-SEO-CODE: /hakkimda is the owner's ProfilePage", () => {
  const [profile, breadcrumb] = createAboutPageJsonLd()["@graph"];
  assert.equal(profile["@type"], "ProfilePage");
  assert.equal(profile["@id"], profilePageEntityId);
  assert.equal(profile.url, "https://www.sabandurali.com/hakkimda");
  assert.deepEqual(profile.mainEntity, createPersonEntity("tr"));
  assert.deepEqual(
    breadcrumb.itemListElement.map((item) => [item.name, item.item]),
    [
      ["Ana sayfa", "https://www.sabandurali.com/"],
      ["Hakkımda", "https://www.sabandurali.com/hakkimda"],
    ],
  );
});

test("ENTITY-SEO-CODE: both contact pages are a ContactPage about the owner", () => {
  for (const [locale, url, home] of [
    ["tr", "https://www.sabandurali.com/iletisim", "Ana sayfa"],
    ["en", "https://www.sabandurali.com/en/contact", "Home"],
  ] as const) {
    const [page, breadcrumb] = createContactPageJsonLd(locale)["@graph"];
    assert.equal(page["@type"], "ContactPage");
    assert.equal(page.url, url);
    assert.deepEqual(page.about, createPersonReference());
    assert.deepEqual(
      breadcrumb.itemListElement.map((item) => item.name),
      [home, contactPageNames[locale]],
    );
    assert.equal(breadcrumb.itemListElement.at(-1)?.item, url);
  }
});

test("ENTITY-SEO-CODE: the JSON-LD page names match the visible breadcrumbs", async () => {
  const contact = await readFile(
    new URL("../components/ContactPage.tsx", import.meta.url),
    "utf8",
  );
  assert.match(contact, new RegExp(`current: "${contactPageNames.tr}"`));
  assert.match(contact, new RegExp(`current: "${contactPageNames.en}"`));
  const about = await readFile(
    new URL("../components/about/AboutPageContent.tsx", import.meta.url),
    "utf8",
  );
  assert.match(about, new RegExp(`label: "${aboutPageName}"`));
});

test("ENTITY-SEO-CODE: the about and contact routes render their JSON-LD", async () => {
  for (const [file, builder] of [
    ["../app/(tr)/hakkimda/page.tsx", "createAboutPageJsonLd()"],
    ["../app/(tr)/iletisim/page.tsx", 'createContactPageJsonLd("tr")'],
    ["../app/(en)/en/contact/page.tsx", 'createContactPageJsonLd("en")'],
  ] as const) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.ok(source.includes(builder), file);
    assert.match(source, /application\/ld\+json/, file);
  }
});

test("JSON-LD serialization escapes markup", () => {
  assert.equal(serializeJsonLd({ a: "</script>" }), '{"a":"\\u003c/script>"}');
});
