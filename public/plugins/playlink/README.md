# PlayLink — Plugin Assets

Drop the plugin's brand assets here. The page expects:

- `PlayLink.png` — square logo, used in the plugin grid card and page header (recommended ≥ 256×256, transparent bg)
- `PlayLinkCover.png` — wide cover image, used as the page hero (recommended 1600×600)

These paths are referenced from `src/data/plugins.json`:

```json
"logo":  "/plugins/playlink/PlayLink.png",
"cover": "/plugins/playlink/PlayLinkCover.png"
```

Until both files are dropped here the page will render with broken image links. The
accent colors (`#0a9b7e` / `#1ad19d`) are placeholders — replace in `plugins.json` after
the brand is finalized.
