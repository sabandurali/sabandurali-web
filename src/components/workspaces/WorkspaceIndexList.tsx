import Eyebrow from "@/components/ui/Eyebrow";
import TextLink from "@/components/ui/TextLink";
import { workspaces } from "@/content/workspaces";
import { getListedWorkspaceEntries } from "./workspace-routes";

/** The six workspaces and their sections on `/calisma-alanlari`. */
export default function WorkspaceIndexList() {
  return (
    <ol className="m-0 grid list-none gap-px overflow-hidden rounded-card border border-ink bg-ink p-0 md:grid-cols-2">
      {workspaces.map((workspace) => (
        <li key={workspace.key} className="flex min-w-0 flex-col bg-land">
          <article
            aria-labelledby={`workspace-${workspace.key}`}
            className="flex flex-auto flex-col gap-3 p-5 sm:p-7"
          >
            <Eyebrow>{workspace.eyebrow}</Eyebrow>
            <h3 id={`workspace-${workspace.key}`} className="m-0 type-h3">
              {/* A link on its own line: at least 44 px tall (§6). */}
              <TextLink
                href={`/${workspace.key}`}
                className="inline-flex min-h-tap items-center"
              >
                {workspace.title}
              </TextLink>
            </h3>
            <p className="m-0 type-small text-ink-muted">
              {workspace.description}
            </p>
            <p className="m-0 mt-2 type-label text-ink-muted">Bölümler</p>
            <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-1 p-0">
              {getListedWorkspaceEntries(workspace).map((entry) => (
                <li key={entry.slug}>
                  <TextLink
                    href={entry.href}
                    className="inline-flex min-h-tap items-center type-small"
                  >
                    {entry.title}
                  </TextLink>
                </li>
              ))}
            </ul>
          </article>
        </li>
      ))}
    </ol>
  );
}
