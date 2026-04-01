# Claude Code — Docs Site Context

This is the documentation site for Imperion Games plugins at **migueltechlead.pt**.
Built with **Astro + Tailwind CSS**, deployed to GitHub Pages on push to `master`.

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
│       ├── index.astro       # Plugin listing page — driven by plugins.json
│       ├── CascadeCombatSystem.astro
│       ├── GearFlow.astro
│       └── WorldSweep.astro
└── components/
    ├── Header.astro
    └── Footer.astro
```

---

## plugins.json Schema

Each plugin entry:

```json
{
  "name": "Cascade Combat System",       // Display name — may contain spaces
  "tagline": "Short pitch sentence",
  "version": "1.0",                      // Always Major.Minor — no patch
  "logo": "/plugins/cascadecombatsystem/CascadeCombatSystem.png",
  "cover": "/plugins/cascadecombatsystem/CascadeCombatSystemCover.png",
  "accent": "#d4600a",                   // Primary brand color
  "accentLight": "#f07820",             // Lighter variant for hover/glow
  "status": "pre-launch",               // live | pre-launch | in-development | coming-soon
  "docsUrl": "/Plugins/CascadeCombatSystem",
  "fabUrl": null,                        // Fab marketplace URL once live
  "hidden": false
}
```

Status values control display order on the listing page: live → pre-launch → in-development → coming-soon.

---

## Plugin Page Structure

Every plugin page follows this exact pattern:

```astro
---
import PluginLayout from '../../layouts/PluginLayout.astro';
import pluginsData from '../../data/plugins.json';
const p = pluginsData.find(x => x.name === 'Plugin Display Name')!;
---
<PluginLayout
  title="Plugin Name — Short SEO description"
  description="Full meta description for search engines."
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
    <!-- more nav groups matching the sections below -->
  </nav>

  <section id="overview">
    <h2>Overview</h2>
    ...
  </section>

  <!-- more sections -->
</PluginLayout>
```

**bg / surface / surface2 / codeBg** are dark hex colors derived from the plugin's accent color.
Pick values that are desaturated near-blacks leaning toward the accent hue.
For example, an orange-accented plugin uses warm near-blacks (#090808, #100c08).

---

## Writing Plugin Documentation

### What to document

Use the plugin's `CHANGELOG.md` as the authoritative guide for what exists and what changed.
Use the `.h` source headers for exact class names, function signatures, and enum values.

### Section organization

Mirror the plugin's domain structure. Group related classes and concepts together.
Good section names: "Combo System", "Inventory", "Equipment", "Targeting", "World Pickups", "Crafting".
Bad section names: "Features", "Components", "API", "Classes".

### Code examples

- Use real class names from the source headers
- Show the minimal setup a developer needs to get a feature working
- UE5 Blueprint and C++ examples where both are relevant
- Prefer Blueprint examples first since most users are Blueprint-first

### Version badge

The version is automatically injected by `PluginLayout` via the `version` prop — you do not need to write it manually in the page content.

### Changelog section

Do NOT add a "Changelog" section to the .astro page itself.
The CHANGELOG.md lives in the plugin repo and is the source of truth.
The docs page documents the current state, not the history.

---

## Adding a New Plugin Page

1. Read the plugin's `CHANGELOG.md` for what it ships with
2. Read the plugin's `.h` headers for class/function names
3. Check `src/data/plugins.json` — the plugin entry should already exist
4. Copy `src/pages/Plugins/GearFlow.astro` as your starting template
5. Replace all GearFlow-specific content with the new plugin's content
6. Choose bg/surface colors that lean toward the plugin's accent hue
7. Ensure every `id` anchor in the page has a matching `<a href>` in the sidebar nav

---

## Updating an Existing Plugin Page

1. Read `CHANGELOG.md` for the released version to find what changed
2. Only modify sections that correspond to changelog entries
3. Add new `<section>` blocks for new systems; add matching nav links
4. Do not rewrite existing sections unless the changelog says behavior changed
5. Keep the sidebar nav in sync with all `id` anchors on the page

---

## Changelog Guidelines (for reference)

The plugin changelogs follow these rules (from `PLUGIN_CHANGELOG_GUIDELINES.md`):
- No dates on version headers
- No `[Unreleased]` section
- Domain-specific section names
- Plain declarative sentences, no leading verbs
- Patch fixes go in git history only — never in the changelog
- First release (1.0.0) has no Fixed section

The changelog is generated automatically when a version tag is pushed.
It is the primary input for deciding what to document.
