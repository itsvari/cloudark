# Design

- `design-guide.md` — the design bible: tokens, type, layout, components, micrographics, motion, accessibility. Read this before touching any UI.
- `buildout-plan.md` — the phased implementation plan for building both sites to match the mockup.
- `mockups/d-signal-ledger.html` — the approved mockup (Direction D, revision 4). Open it in a browser at 1280px or wider. Every page is rendered from one set of markup at 390, 768, 1280 and 2560 via container queries, so the file is also a working reference implementation of the responsive rules.
- `fonts.sh` — regenerates `mockups/fonts/*.woff2` from the fonts installed on this machine. The folder is git-ignored because TX-02 is licensed.
