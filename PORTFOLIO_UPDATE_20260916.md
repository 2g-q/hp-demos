# Portfolio cover refresh — approved direction

## Latest owner correction

After publication the owner asked to keep the previous appearance of the section introduced by 「会社案内、集客、採用など、目的に合わせたサイトの制作例です。」. All 11 image references in `#web` are restored to f26dfd6. The other 21 covers remain new. Future updates must preserve the original `#web` thumbnails unless explicitly requested. The generated 32-cover manifest below remains an asset inventory, not the current selection of live image references. QA verifies the 11 restored references separately.

## Scope and design

The owner approved the 2026-09-16 editorial proof and requested rollout and publication. All 32 cards currently listed in `cw.html` now reference individual covers in `pf/real-covers/`. No card destination, target, order, or existing card-body text is changed. The separately added health-report page is not listed in cw.html and was not added to the catalog by this task.

Each cover combines a captured demo/design image, a concrete Japanese headline, a category icon, and an individual palette/layout/motif combination. Preserve full captured-region bounds; do not crop away image edges to make the image appear larger. A captured region is not necessarily the entire destination page. Small UI text is for context; the headline must identify the job at card size.

`cw-api-link` and `cw-automation` describe services rather than an interactive application. Their frames explicitly say 関連デモ and use the site's shipping-input and post-collection-notification screens. These are illustrative related demos, not proof of a live external API connection or actual client data. All source-image mappings and related-demo paths are retained in `pf/real-covers/manifest.json`.

## Maintenance

### Destination backgrounds

Approved clear-glass rollout supersedes the vintage settings below: grain removed, white base alpha12%, real backdrop blur3px/saturate1.2, directional edge highlights. Preserve all21 motifs; choose outer text from each palette. Product-catalog now uses blue-grey #b8cbd3 / ink#203743 / accent#e5f4f5 in both destination and thumbnail. The builder and manifest are synchronized; other31 thumbnail images are untouched. Native Apple optical simulation is not claimed. See `GLASS_DESIGN_REFERENCE.md` for design distinctions and accessibility considerations.

Latest owner adjustment: return the glass base opacity from 82% to 64%. Keep RGB(248,249,246), grain, blur, geometry and other styling unchanged. This supersedes the 82% setting described below.

Readability correction: one continuous white/light-grey sheet sits behind the whole content, not separate section cards. Owner selected material proof A (fine embossed vintage glass), with stronger white than its original 64% opacity: final base opacity is 82%, with subtle SVG grain, edge highlights and 10px backdrop blur. It is max 1240px wide and narrower than the viewport (mobile leaves 6px outer margins). Outer text is dark grey. The original motif remains behind and around the sheet. Only the backdrop is blurred; text and demo windows remain sharp. Preserve this protection when changing motifs; the high-opacity surface remains readable without backdrop-filter support.

Owner correction: matching only solid colours was insufficient. Preserve the cover's actual `motif` as well as its palette: paper, sun, orbit, stripes, grid, steps, route, radar and loop. The destination CSS recreates those cover geometries, angles, accent colours and opacity; viewport sizing/position adapts them to a scrolling page. Left-composed covers retain left placement. The static decorative layer stays behind the content and never captures input. Workbench changes motif together with palette. Do not replace these with one generic background texture.

The 21 active new covers now share their base palette with their 19 destination HTML pages via `assets/portfolio-page-theme.{css,js}`. Workbench follows the data/shipping/review hash and tab changes. The 11 restored website examples remain unchanged. Theme selectors exclude application/window descendants; embedded documents are not modified. Orange product-catalog uses dark outer text for contrast. No public copy, navigation targets or processing logic changed.

Verification: `python3 pf/verify_page_themes.py` checks all 21 destinations at 1440 and 390 px, compares the palette to the active cover manifest, checks horizontal overflow, compares inner demo computed styles with the theme stylesheet disabled, and exercises the three workbench tabs. Screenshots and JSON evidence are stored outside the repository. Set `THEME_QA_URL` to repeat against a published base URL.

- Render: `python3 pf/build_real_portfolio.py --render-only`
- Browser QA: `python3 pf/verify_real_portfolio.py`
- `COVER_QA_URL` changes the QA URL; `COVER_QA_BASE` changes the pre-edit comparison revision (default f26dfd6).
- Raw captures are under `pf/real-covers/screens/`; covers are JPEG files. Keep the old artwork untouched for recovery.
- Wait for each demo action to finish before capturing. A button click alone is not evidence of the result state.

## Verification

All 32 generated covers pass frame-bound, heading-separation, description-separation and original-image-ratio checks in `pf/real-covers/checks.json`. Browser QA checks all images, unique image hashes and palettes, unchanged links/card bodies, and horizontal overflow at 1440/768/390/360 pixels. The contact sheet and selected covers were also visually reviewed; tall results were re-captured as coherent result regions instead of shrinking full-page screenshots.

Japanese headline review used natural-japanese quick mode. Lint reported only two rhythm/length-uniformity warnings across the collection of 32 independent short headings. Retained intentionally: these are separate thumbnail labels with a shared size constraint, not continuous prose. No numbers, qualifications or performance claims were invented for the headline copy.

Publication readback is recorded in the task handoff after deployment; a local pass is not a public-deployment claim.

The catalog action-link colour was also made darker for readability on white cards. QA scrolls through every card to trigger the site's real reveal animation before saving the full-page evidence; image loading alone is not treated as visible-card verification.
### Catalogue category routes

The catalogue is now three same-tab pages: `cw.html` (16 business/AI demos), `cw-web.html` (11 website examples), and `cw-social.html` (5 LINE/SNS/design examples). All 32 card images, descriptions and destinations are preserved; no examples are collapsed. Individual samples open in a new browser tab. Client support stories remain on the independent `cases.html` page, linked from the main header. Old `cw.html#web`, `#sns`, `#cases` and `#pricing` bookmarks redirect to the corresponding page. Navigation and the white catalogue background are shared. The new regression is `pf/verify_catalog_routes.py`; theme QA reads all three catalogues. Japanese label lint reported only uniform-length headings, intentionally retained for consistent navigation. Existing body copy was preserved.
