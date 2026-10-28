# Agent prompts

Prompts and task briefs written for AI coding agents. The rules every agent
follows today are `CLAUDE.md` and `AGENTS.md` at the repository root; when a
file here disagrees with them, those rules win.

- `CODEX-39-ILCE-MASTER-TALIMAT.md` — the task brief of the 39-district
  milestone (September 2026). Historical: the milestone is closed
  (`docs/PROJECT-STATE.md` §G). Its line about not editing the admin guide
  predates the generated guide; edit
  `src/components/admin/help/admin-help-guide.ts` and run
  `npm run generate:admin-guide` instead.
- `RESUME-PROMPT.txt` — a prompt to resume work after a break. It asks the
  agent to read `docs/PROJECT-STATE.md`, `docs/NEXT-STEPS.md` and the archived
  prototype decisions first and to report before changing anything.
