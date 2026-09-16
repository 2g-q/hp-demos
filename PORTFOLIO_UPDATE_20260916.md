# Portfolio cover refresh — approved direction

## Scope and design

The owner approved the 2026-09-16 editorial proof and requested rollout and publication. All 32 cards currently listed in `cw.html` now reference individual covers in `pf/real-covers/`. No card destination, target, order, or existing card-body text is changed. The separately added health-report page is not listed in cw.html and was not added to the catalog by this task.

Each cover combines a captured demo/design image, a concrete Japanese headline, a category icon, and an individual palette/layout/motif combination. Preserve full captured-region bounds; do not crop away image edges to make the image appear larger. A captured region is not necessarily the entire destination page. Small UI text is for context; the headline must identify the job at card size.

`cw-api-link` and `cw-automation` describe services rather than an interactive application. Their frames explicitly say 関連デモ and use the site's shipping-input and post-collection-notification screens. These are illustrative related demos, not proof of a live external API connection or actual client data. All source-image mappings and related-demo paths are retained in `pf/real-covers/manifest.json`.

## Maintenance

- Render: `python3 pf/build_real_portfolio.py --render-only`
- Browser QA: `python3 pf/verify_real_portfolio.py`
- `COVER_QA_URL` changes the QA URL; `COVER_QA_BASE` changes the pre-edit comparison revision (default f26dfd6).
- Raw captures are under `pf/real-covers/screens/`; covers are JPEG files. Keep the old artwork untouched for recovery.
- Wait for each demo action to finish before capturing. A button click alone is not evidence of the result state.

## Verification

All 32 generated covers pass frame-bound, heading-separation, description-separation and original-image-ratio checks in `pf/real-covers/checks.json`. Browser QA checks all images, unique image hashes and palettes, unchanged links/card bodies, and horizontal overflow at 1440/768/390/360 pixels. The contact sheet and selected covers were also visually reviewed; tall results were re-captured as coherent result regions instead of shrinking full-page screenshots.

Japanese headline review used natural-japanese quick mode. Lint reported only two rhythm/length-uniformity warnings across the collection of 32 independent short headings. Retained intentionally: these are separate thumbnail labels with a shared size constraint, not continuous prose. No numbers, qualifications or performance claims were invented for the headline copy.

Publication readback is recorded in the task handoff after deployment; a local pass is not a public-deployment claim.
