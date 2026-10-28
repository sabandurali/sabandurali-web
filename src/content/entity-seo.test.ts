import assert from "node:assert/strict";
import test from "node:test";
import {
  createHomeEntityJsonLd,
  createPersonEntity,
  createPersonReference,
  personEntityId,
  personProfileUrls,
  serializeJsonLd,
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

test("the Turkish home graph links WebSite and ProfilePage to the person", () => {
  const graph = createHomeEntityJsonLd("tr")["@graph"];

  assert.deepEqual(
    graph.map((node) => node["@type"]),
    ["WebSite", "ProfilePage", "Person"],
  );
  assert.deepEqual(
    graph.find((node) => node["@type"] === "ProfilePage"),
    {
      "@type": "ProfilePage",
      "@id": "https://www.sabandurali.com/#profile",
      url: "https://www.sabandurali.com/",
      mainEntity: { "@id": personEntityId },
    },
  );
  assert.deepEqual(
    createHomeEntityJsonLd("en")["@graph"].map((node) => node["@type"]),
    ["Person"],
  );
});

test("JSON-LD serialization escapes markup", () => {
  assert.equal(serializeJsonLd({ a: "</script>" }), '{"a":"\\u003c/script>"}');
});
