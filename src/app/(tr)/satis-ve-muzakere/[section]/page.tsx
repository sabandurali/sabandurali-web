import { createWorkspaceSectionRoute } from "@/components/workspaces/workspace-section-route";
import { getWorkspaceSectionParams } from "@/content/workspaces";

const route = createWorkspaceSectionRoute("satis-ve-muzakere");

/* Sections are prerendered and refreshed hourly: on-demand revalidation
   covers edits, the time-based value covers scheduled publishing (see
   src/lib/revalidation.ts). Entries that point elsewhere are not
   prerendered; they redirect when requested. */
export const revalidate = 3600;

export function generateStaticParams() {
  return getWorkspaceSectionParams("satis-ve-muzakere");
}

export const generateMetadata = route.generateMetadata;

export default function SalesNegotiationSectionPage(props: {
  params: Promise<{ section: string }>;
}) {
  return <route.WorkspaceSectionPage {...props} />;
}
