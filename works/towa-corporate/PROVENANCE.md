# TOWA INDUSTRIES — original concept website

Created 2026-10-03 JST for ミナト AI・IT ラボ. This is a fictional metal-fabrication company, not a delivered customer project or a claim about a real company. Original layout, copy, wordmark and CSS/JS. No third-party site HTML, logo, prose or screenshots were copied.

## Photography

License checked 2026-10-02/03: https://unsplash.com/license . Each source page labels the selected photo “Free to use under the Unsplash License”; none is an Unsplash+ paid image. Local WebP derivatives are resized/compressed versions for this concept website.

- `assets/welding.webp`: Cemrecan Yurtman, https://unsplash.com/photos/a-man-working-on-a-machine-in-a-factory-FP_DJBVtwdw . Source image `photo-1730584474338-aa8d9d186bf7`. Stock image used to illustrate fabrication, not TOWA employees/equipment. Equipment trademarks visible in the source are incidental, not our brand/endorsement.
- `assets/metalwork.webp`: https://unsplash.com/photos/man-grinding-metal-tool-in-industrial-machinery-wpvEMgFV4w0 . Source image `photo-1528953030358-b0c7de371f1f`. Illustrative stock photograph; not a company employee or testimonial.

Raw JPGs were retained locally as source files; public HTML uses WebP (approximately 456 KB combined). Publish referenced WebP only. Photos have image descriptions and dimensions, below-fold photos use lazy loading. The footer explicitly says photos are illustrative and the company is fictional.

Second-pass asset: `assets/milling.webp`, aluminum Zheng ji, https://unsplash.com/photos/a-machine-that-is-cutting-a-piece-of-metal-sxtClAGwRck ; source `photo-1740209475472-aa7d280f7452`. Free Unsplash License verified on the photo page on 2026-10-03. This is an illustrative CNC machining photo, not evidence of actual TOWA equipment. The blue bracket drawing is original inline SVG, an unscaled conceptual diagram without numerical precision/performance claims.

`assets/metal.webp` is an unused experiment (metal chips, not a finished part); exclude it and raw JPGs from deployment. Reference-site PNGs are local inspection evidence only and must not be published.

## Interaction / QA

- Page consists of five sections: hero, capabilities, approach, process, inquiry preview.
- Inquiry choices update local explanatory text. Dialog is informational only. No personal fields, external submissions, storage, tracking, payment or real inquiry.
- Second pass replaces three generic capability cards with a photographic technical selector. Cutting / sheet metal / welding buttons update the image, shapes and consultation checklist, and the selected topic carries into the inquiry section. The main hero now shows actual machining rather than decorative English words.
- Dedicated headless Chrome for Testing from `automation.chrome_bin.chrome_bin`; HTTP on localhost:8769.
- `qa.py` checks 1440 and 390 px, full-page screenshot after scrolling to load lazy images, image completeness, no horizontal overflow/page errors, mobile menu/Escape, inquiry selection/dialog, reduced motion and no write requests.
- Evidence: `qa-results.json`, `preview-*.png`, `qa-*.png`. Screenshot and QA utilities are local evidence, not marketing assets. Source has visible return link to `../../cw-web.html`.
- Copy reviewed with natural-japanese quick; no fabricated certification, numerical results or testimonials.
- Additional live checks at 320 and 768 px found no horizontal overflow. The Japanese hero's terminal full stop was removed after copy review.
- Machine lint was attempted on `copy-review.txt`; it could not run because the standard Python environment lacks `sudachipy`. No lint-pass claim is made; manual quick review is complete.

## Second design pass / 2026-10-03

Actual reference websites inspected in headless Chrome, full-page and scroll-position screenshots: Chromateach https://nisshodenkiseigyo.com/chromateach/ and MY genius https://mygenius.jp/ (found through https://sankoudesign.com/category/lp/). Learned from section-specific visual storytelling, photo editing and concrete decision information, not copied layouts/assets/text. Reference screenshots stay local and are excluded from public assets.

Final second-pass QA: 1440/390 px full-page image and interaction checks; additional 320/768 px overflow checks. Screenshots in `qa-*.png`, `preview-*.png`, `editorial-*.png` are local evidence only. Used photos are explicitly illustrative and compressed to WebP. Text sizes in new explanatory sections were increased for readability, and photo/copy consistency manually inspected. Parent agent owns the final natural-japanese machine-lint pass and independent audit.
