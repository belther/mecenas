# Project-local design skills

Nabo selected this initial set on 2026-11-21 after reviewing Lookbook's research.
These are development instructions, not Mecenas application dependencies.
They are installed only in this checkout's `.agents/skills/`, excluded from Git
and Vercel uploads. No account-wide skills, hooks or application files changed.

| Skill | Intended role | Pinned public source |
| --- | --- | --- |
| Frontend Design | Main builder: visual direction, typography and layout grounded in Mecenas's illustration audience. | [Anthropic source](https://github.com/anthropics/claude-plugins-official/tree/73c8cf3ea7e296057b467990f2f5d61b4c922260/plugins/frontend-design/skills/frontend-design) |
| emil-design-eng | Interaction details, component feedback and restrained, accessible motion. | [Emil Kowalski source](https://github.com/emilkowalski/skills/tree/64eb3deb9a5fbfa041faf783e0bc3fd635872e9c/skills/emil-design-eng) |
| web-design-guidelines | Accessibility, forms and responsive interface review. Rules are bundled locally, not fetched during each review. | [Vercel source](https://github.com/vercel-labs/agent-skills/tree/5a37a6329fbad3666c3207392a6a7c0110e92efb/skills/web-design-guidelines) |

After normalizing Windows Git checkout line endings to LF, the installed skill
files were compared byte-for-byte to the reviewed pinned sources. Vercel's
bundled rules match its declared SHA-256:
`d246b026f4f29b5823a9cc857f9edf3d2507002e055e32040cadeaf3b38e0234`.
The installer only copied these selected folders; no skill scripts were run.
Local per-file installation identities are retained in ignored
`local-evidence/design-skills-install-manifest.json`.

Source repositories were checked on 2026-11-21. Anthropic's collection had about
47.9k stars and recent activity that day; Emil's collection about 58.7k stars
and a November 15 update; Vercel's collection about 34.7k stars and a November
20 update. These are repository-level adoption signals, not skill quality or
security guarantees. Selection also used Lookbook's November 18 instruction-file
research and a fresh read of the pinned skills.

## First use and later comparison

Recommended sequence for the next design task: Frontend Design establishes the
visual plan; Emil guides interaction details; Vercel reviews the result. This
installation does not authorize redesign or deployment by itself. Existing
product scope and owner decisions still apply.

Nabo deferred Impeccable for a later comparison with automatic hooks off.
It is not installed. “Trial” meant comparing a design approach on one screen,
not a paid subscription trial or an expiry. Its reviewed public skill is
Apache-2.0; its engine, file-writing behavior and cache scope need a separate
check before first use. Do not combine two competing builder workflows in the
same design pass merely because both are available.

These records do not install skills in another checkout. To reproduce the set,
use the Skill Installer with the pinned repository/path and an explicit
project-local destination. Preserve upstream license files when copying.
