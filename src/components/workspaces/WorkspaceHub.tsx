import { PhotoCardList } from "@/components/pages/PublicationCardLists";
import { excerpt } from "@/components/sections/home-selection";
import Card from "@/components/ui/Card";
import DistrictKeyMap from "@/components/ui/DistrictKeyMap";
import Section from "@/components/ui/Section";
import TextLink from "@/components/ui/TextLink";
import { getDistrict } from "@/content/districts/district-registry";
import { getDistrictPath } from "@/content/districts/district-routes";
import { photoListPaths } from "@/content/photos/photo-routes";
import type { Workspace } from "@/content/workspaces";
import type { WorkspaceHubFeature } from "./workspace-hub-data";
import {
  workspaceHubCountLabel,
  type WorkspaceHubEntry,
} from "./workspace-hub";

const sideLabel = { avrupa: "Avrupa Yakası", anadolu: "Anadolu Yakası" };

/**
 * The featured slot of a hub (UX-03): the featured district guide with its
 * place on the key map, or the newest photographs. Rendered only when
 * there is published content to feature.
 */
export function WorkspaceHubFeatureSlot({
  workspace,
  feature,
}: {
  workspace: Workspace;
  feature: WorkspaceHubFeature;
}) {
  const headingId = `${workspace.key}-featured`;

  if (feature.kind === "photos") {
    return (
      <Section labelledBy={headingId} divider>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <h2 id={headingId} className="m-0 type-h2">
            Son fotoğraflar
          </h2>
          <TextLink href={photoListPaths.tr} variant="standalone" locale="tr">
            Tüm fotoğraflar
          </TextLink>
        </div>
        <PhotoCardList photos={feature.photos} columns={4} />
      </Section>
    );
  }

  const district = getDistrict(feature.slug);
  if (district === null) return null;

  return (
    <Section labelledBy={headingId} divider>
      <h2 id={headingId} className="m-0 mb-8 type-h2">
        Öne çıkan ilçe rehberi
      </h2>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] md:items-start md:gap-10">
        <figure className="m-0">
          <DistrictKeyMap
            featuredSlug={district.slug}
            title={`İstanbul’un 39 ilçesi; ${district.name} işaretli`}
            className="max-w-[28rem]"
          />
          <figcaption className="pt-2.5 type-caption text-ink-muted">
            {district.name}, {sideLabel[district.side]}
          </figcaption>
        </figure>
        <Card
          title={district.name}
          href={getDistrictPath(district.slug)}
          headingLevel={3}
          cta="Rehberi aç"
          eyebrow={<span>{sideLabel[district.side]}</span>}
        >
          {feature.summary.trim() === "" ? null : (
            <p className="m-0 type-body text-ink">
              {excerpt(feature.summary, 260)}
            </p>
          )}
        </Card>
      </div>
    </Section>
  );
}

/**
 * The section cards of a hub, filled sections first, each with what it
 * holds ("3 yayın", "Henüz yayın yok") so an empty section no longer
 * looks as weighty as a filled one (UX-09).
 */
export function WorkspaceHubSections({
  workspace,
  entries,
}: {
  workspace: Workspace;
  entries: readonly WorkspaceHubEntry[];
}) {
  const headingId = `${workspace.key}-sections`;

  return (
    <Section tone="band" labelledBy={headingId} divider>
      <h2 id={headingId} className="m-0 mb-8 type-h2">
        Bölümler
      </h2>
      <ul className="m-0 grid list-none gap-5 p-0 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((item) => {
          const countLabel = workspaceHubCountLabel(item);
          const empty = item.count === 0;
          return (
            <li key={item.entry.slug} className="flex min-w-0">
              <Card
                title={item.entry.title}
                href={item.entry.href}
                cta="Bölümü aç"
                className="w-full"
                eyebrow={
                  countLabel === null ? undefined : (
                    <span
                      className={
                        empty
                          ? "type-data text-ink-muted"
                          : "type-data font-semibold text-ink"
                      }
                    >
                      {countLabel}
                    </span>
                  )
                }
              >
                <p className="m-0 type-small text-ink-muted">
                  {item.entry.description}
                </p>
              </Card>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
