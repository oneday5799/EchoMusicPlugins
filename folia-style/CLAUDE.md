# CLAUDE.md

## Upstream Repository

This project syncs from [EchoMusic-org/folia-style](https://github.com/EchoMusic-org/folia-style).

### Files synced from upstream

| File | Description |
|------|-------------|
| `folia/css/base.css` | Base CSS styles (uses `var(--lyric-font-family,...)` CSS variable) |
| `folia/bridge.html` | Main HTML bridge page (modified: adds `<link rel="stylesheet" href="fonts/fonts.css">` before base.css) |
| `index.js` | Host-side bridge plugin code (major update with font watching, lyric filtering, appearance pushing) |

### Key changes from upstream

- **bridge.html**: Added `<link rel="stylesheet" href="fonts/fonts.css">` before `<link rel="stylesheet" href="css/base.css">`
- **base.css**: Uses `var(--lyric-font-family,...)` CSS variable for font family
- **index.js**: Major update including:
  - Font family watching and appearance pushing
  - Lyric filter support (regex-based filtering)
  - `echo-folia:appearance` message type for font synchronization
  - `buildAppearancePayload()` and `pushAppearance()` functions
  - `initFontWatch()` for reactive font settings

### Sync date

Last synced: 2026-07-23
