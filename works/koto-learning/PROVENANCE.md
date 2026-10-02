# koto. — original adult atelier concept

Created 2026-10-03 JST for ミナト AI・IT ラボ. Fictional pottery/art class website, not a real school, availability claim or client project. Original copy, wordmark, paper collage composition, CSS, JS, SVG arrow and noise texture. Reference assets/text/logos were not copied.

## Photography

All source pages explicitly marked the photos free under https://unsplash.com/license when checked 2026-10-02/03. No Unsplash+ paid photos.

- `assets/pottery.webp`: https://unsplash.com/photos/a-person-making-a-pot-on-a-potters-wheel-z_Hx70LZOAk ; image `photo-1703289631067-3df3353f4592`.
- `assets/clay.webp`: https://unsplash.com/photos/a-man-is-making-a-vase-out-of-clay-K9BCfDWFiZI ; image `photo-1632157071684-a1cf9c22fe98`.
- `assets/paint.webp`: Steve A Johnson, https://unsplash.com/photos/brown-paint-brushes-on-assorted-color-paint-palette-A2OL6S9zB7o ; image `photo-1522410818928-5522dacd5066`.

- `assets/bowl.webp`: TAN Erica, https://unsplash.com/photos/round-white-ceramic-bowl-zCYO9HxEAjI ; source `photo-1510035618584-c442b241abe7`. Source page HTML verified on 2026-10-03: ImageObject author TAN Erica, `isAccessibleForFree:true`, license link https://unsplash.com/license and visible “Free to use under the Unsplash License”. Caption explicitly says completed pottery imagery, not a student's actual work.

Local resized WebP derivatives approximately 348 KB combined. Raw JPGs kept locally, not needed for deployment. People/locations are illustrative stock; footer says they are not actual teachers or school. Hero is eager/high priority; class images are lazy and have dimensions. `assets/gallery.jpg` was rejected/unused and must not be published.

## QA and content

Eight sections: photographic collage hero, concept, pottery/art classes, completed-bowl feature, clay-to-pottery photographic journey, visit flow, FAQ, interactive class preview. Prices/time/course contents explicitly described as fictional. No student counts or fake reviews. Process photos are explicitly separate illustrative images, not a claimed record of producing the same bowl. Paper layers, rotated cuts and staggered process photography vary the visual rhythm.

Class buttons choose the matching course and move focus to the local form. Form selects preferred day; modal confirms course and fictional price/time. No names/contact information, external transmission, payments or real bookings.

Tested desktop 1440 and mobile 390 with canonical headless Chrome for Testing. `../towa-corporate/qa.py`: responsive overflow, image load after scrolling (initial lazy-image race addressed in QA by actual scroll), JS errors, menu/Escape, course and day choice/modal, reduced motion, zero write requests. Evidence `qa-results.json`, `qa-*.png`, `preview-*.png` are local QA only. Natural-japanese quick copy review completed.

Additional live overflow checks passed at 320/768 px. Machine Japanese lint attempted but could not run because standard Python lacks `sudachipy`. Manual quick copy review completed; no machine lint-pass claim.

## Second design pass / 2026-10-03

Actual reference websites inspected in headless Chrome, full-page and scroll-position screenshots: Chromateach https://nisshodenkiseigyo.com/chromateach/ and MY genius https://mygenius.jp/ (found through https://sankoudesign.com/category/lp/). Learned from section-specific visual storytelling, photo editing and concrete decision information, not copied layouts/assets/text. Reference screenshots stay local and are excluded from public assets.

Final second-pass QA: 1440/390 px full-page image and interaction checks; additional 320/768 px overflow checks. Screenshots in `qa-*.png`, `preview-*.png`, `editorial-*.png` are local evidence only. Used photos are explicitly illustrative and compressed to WebP. Text sizes in new explanatory sections were increased for readability, and photo/copy consistency manually inspected. Parent agent owns the final natural-japanese machine-lint pass and independent audit.
