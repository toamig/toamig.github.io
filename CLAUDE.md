# Claude Code — Docs Site Guidelines

Documentation site for Imperion Games plugins at **migueltechlead.pt**.
Astro + Tailwind CSS, deployed to GitHub Pages on push to `master`.

---

## Site Structure

```
src/
├── data/
│   └── plugins.json          # Plugin metadata: name, version, status, colors, urls
├── layouts/
│   └── PluginLayout.astro    # Shared layout for all plugin doc pages
├── pages/
│   ├── index.astro
│   └── Plugins/
│       ├── index.astro       # Plugin listing — driven by plugins.json
│       ├── CascadeCombatSystem.astro
│       ├── GearFlow.astro
│       └── WorldSweep.astro
└── components/
    ├── Header.astro
    └── Footer.astro
```

---

## plugins.json Schema

```json
{
  "name": "Cascade Combat System",
  "tagline": "One sentence pitch",
  "version": "1.0",
  "logo": "/plugins/cascadecombatsystem/CascadeCombatSystem.png",
  "cover": "/plugins/cascadecombatsystem/CascadeCombatSystemCover.png",
  "accent": "#d4600a",
  "accentLight": "#f07820",
  "status": "pre-launch",
  "docsUrl": "/Plugins/CascadeCombatSystem",
  "fabUrl": null,
  "hidden": false
}
```

Status order on listing page: `live` → `pre-launch` → `in-development` → `coming-soon`.

---

## Plugin Page Template

```astro
---
import PluginLayout from '../../layouts/PluginLayout.astro';
import pluginsData from '../../data/plugins.json';
const p = pluginsData.find(x => x.name === 'Plugin Display Name')!;
---
<PluginLayout
  title="Plugin Name — Short SEO title"
  description="Full meta description."
  pluginName="Plugin Display Name"
  version={p.version}
  coverImage={p.cover}
  logoImage={p.logo}
  fabUrl={p.fabUrl ?? '#'}
  accent={p.accent}
  accentLight={p.accentLight}
  bg="#090808"
  surface="#100c08"
  surface2="#180f08"
  codeBg="#090608"
>
  <nav slot="sidebar-nav">
    <div class="nav-group">
      <span class="nav-group-label">Introduction</span>
      <a href="#overview">Overview</a>
      <a href="#getting-started">Getting Started</a>
    </div>
  </nav>

  <section id="overview">
    <h2>Overview</h2>
  </section>
</PluginLayout>
```

**bg / surface / surface2 / codeBg**: near-black hex values that lean toward the plugin's accent hue.
Orange accent → warm near-blacks. Blue accent → cool near-blacks. Keep them dark and desaturated.

---

## Writing Guidelines

### Sources of truth — read in this order

1. `plugin-source/CHANGELOG.md` — what changed in this release and what the plugin ships with
2. `plugin-source/Source/` `.h` headers — exact class names, function signatures, enums, interfaces
3. Existing `.astro` page (if any) — what is already documented, what to preserve

**Never invent class names, function signatures, or behavior.** If something isn't in the headers, don't document it.

---

### Tone and voice

- Developer-to-developer. Direct, precise, no marketing fluff.
- Assume the reader knows Unreal Engine but is new to this plugin.
- Explain *what* something does and *why* you'd use it — not just its name.
- No filler phrases: "powerful", "easy to use", "seamlessly", "robust".

---

### Page structure — always in this order

1. **Overview** — What problem this plugin solves. 2–4 sentences max. No bullet lists.
2. **Getting Started** — Minimal setup to get the plugin working. Step by step. Show the first thing a developer actually does.
3. **Domain sections** — One section per major system (see naming rules below).
4. **Multiplayer** — If the plugin has replication support, document it in its own section.
5. **Breaking Changes** — Only present on major version (2.0, 3.0, etc.). See rules below.

---

### Section naming

Section names must reflect the plugin's domain — never generic labels.

| Bad | Good |
|-----|------|
| Features | Combo System |
| Components | Inventory |
| API | Targeting |
| Classes | World Pickups |
| Changes | Equipment |

Group related classes under one section. Don't create a section per class.

---

### Content depth per section

Each section should contain:
- One short paragraph explaining what the system does and when to use it
- The primary class(es) involved, with their purpose stated clearly
- A minimal working code example (Blueprint or C++ — see rules below)
- Key properties or functions worth calling out, as a short list

Do not write exhaustive API references. Document the 20% developers will use 80% of the time.

---

### Code examples

- **Must compile.** Use real class names, real function names, real parameter types from the headers.
- **Minimal.** Show the smallest amount of code that demonstrates the concept. No full game boilerplate.
- **Blueprint-first.** Most users are Blueprint developers. Show Blueprint usage before C++ when both are relevant.
- **No pseudocode.** If you're unsure of the exact API, leave the example out rather than inventing it.
- **One example per section** unless two approaches (Blueprint vs C++) genuinely differ in setup.

---

### Sidebar nav rules

- Every `<section id="...">` on the page must have a matching `<a href="#...">` in the sidebar nav.
- Group nav links under `nav-group` with a `nav-group-label` that matches the section's theme.
- Max ~5 links per nav group. If a group has more, split it.
- Introduction group always comes first with Overview and Getting Started.

---

### What NOT to document

- Private or internal classes (prefixed with `F` implementation details, `Private/` folder internals)
- Classes that are base classes only with no direct user-facing API
- Editor-only tooling unless it directly affects plugin configuration
- A "Changelog" section — the CHANGELOG.md is the source of truth, not the docs page

---

### Version badge

Injected automatically by `PluginLayout` via the `version` prop. Do not write it in content.

---

## Creating a New Plugin Page (1.0 release)

1. Read `plugin-source/CHANGELOG.md` — the 1.0 entry lists everything the plugin ships with
2. Read all `.h` files in `plugin-source/Source/Public/` for class and function names
3. Verify `src/data/plugins.json` has an entry for this plugin
4. Use `src/pages/Plugins/GearFlow.astro` as the structural template
5. Replace all GearFlow content with this plugin's content
6. Choose bg/surface hex colors that lean toward this plugin's accent color
7. Every `id` anchor must appear in the sidebar nav

---

## Updating an Existing Plugin Page (post-1.0 release)

1. Read `plugin-source/CHANGELOG.md` and find the section for this exact version
2. Each changelog entry maps to a docs section — only touch those sections
3. **New system in changelog** → add a new `<section>` block and a matching sidebar nav link
4. **Changed behavior in changelog** → update the relevant section's explanation and example
5. **Fixed entry in changelog** → no docs change needed unless the fix changes how users interact with the API
6. Do not rewrite, reformat, or improve sections that have no corresponding changelog entry
7. Keep the sidebar nav in sync after any additions

---

## Breaking Changes Section (major versions only)

When releasing a major version (2.0, 3.0, etc.), add a `### Breaking Changes` section
**at the top of the page, right after Overview**, with:

- What was removed or renamed
- The direct migration path (old API → new API)
- If an automatic migration exists, mention it

Example format:
```
### Breaking Changes in 2.0

**UCascadeComboDefinition renamed to UCascadeSequenceAsset**
Replace all references in your project. No data migration needed — existing assets reload automatically.

**OnComboCompleted signature changed**
Old: `void OnComboCompleted()`
New: `void OnComboCompleted(ECascadeEndReason Reason)`
Update all Blueprint and C++ overrides to include the new parameter.
```

Remove this section when the next minor version ships — it's only relevant during the upgrade window.

---

## Never Do These

- Modify `src/data/plugins.json` version field — the workflow already handles it
- Add a Changelog section to the docs page
- Invent API examples that aren't backed by the source headers
- Rewrite existing sections that have no changelog entry for this version
- Add sections for systems not mentioned in the changelog (for update runs)
- Remove existing content unless the changelog explicitly says something was removed
- Change the visual style, colors, or layout patterns of existing pages
