# CRAFT — original furniture-workshop recruitment concept

Created 2026-10-03 JST for ミナト AI・IT ラボ. Fictional furniture workshop recruitment website. Not an actual employer/vacancy, employee profile, client achievement or hiring promise. All wordmarks, layout, CSS/JS and Japanese prose are original.

## Photography and rights

- `assets/carpentry.webp`: https://unsplash.com/photos/carpenter-working-with-wood-in-a-workshop-oW4mPEcgdEc ; image `photo-1769353086138-19ee65291a04`.
- The photo page explicitly marks the photo free under https://unsplash.com/license (checked 2026-10-02/03). Not Unsplash+. Stock model/location are illustrative, not CRAFT staff/premises. No testimonial/endorsement is implied.
- `assets/chair.webp`: syahmi syahir, https://unsplash.com/photos/modern-wooden-chair-with-a-light-grey-cushion-jg4F8uFPEnE ; source `photo-1774296245132-7e6da50e12a9`. Free Unsplash License checked on the source page 2026-10-03. Caption explicitly describes furniture imagery, not a CRAFT product.
- `assets/tools.webp`: Tima Miroshnichenko, https://www.pexels.com/photo/close-up-shot-of-woodwork-tools-on-a-wooden-surafce-6790750/ ; source https://images.pexels.com/photos/6790750/pexels-photo-6790750.jpeg . Source page says free to use; https://www.pexels.com/license/ checked 2026-10-03. Illustrative tools, not actual premises or endorsement.
- Compressed local WebP derivatives total approximately 432 KB. Original JPGs retained locally, not required for public deployment. No copied assets from design-reference sites. `assets/workshop.jpg` was rejected after visual inspection and is not used; do not publish it.

## Content and QA

Seven composed sections: hero, furniture/tool photo journal, job roles, day-in-workshop, expandable job descriptions, sample employment conditions, visit flow. Working hours and salary are explicitly fictional examples of recruitment information, not actual employment conditions. No hiring statistics, testimonials or benefits are invented as real facts. The second pass removes the giant outline-English block and adds product texture, tools and decision-useful conditions. Choosing the design job carries that role to the visit selector.

Visit dialog allows role/time selection only. It explicitly says no reservation, external transmission or personal-data collection occurs. Native dialog supports Escape and focus return; mobile menu has expanded state and Escape.

Verified at 1440 and 390 px via `../towa-corporate/qa.py`, headless Chrome for Testing using canonical `automation.chrome_bin.chrome_bin`. Lazy loading, full-page visual evidence, overflow, broken images, JS errors, reduced motion, local dialog and absence of write requests checked. Results in `qa-results.json`; images `qa-*.png`, `preview-*.png` are local QA evidence. Footer and top notice disclose fiction and stock imagery. Natural-japanese quick copy review completed.

Additional live 320/768 px overflow checks passed. Machine Japanese lint was attempted but unavailable because `sudachipy` is absent from standard Python. Manual quick review completed; no machine lint-pass claim.

## Second design pass / 2026-10-03

Actual reference websites inspected in headless Chrome, full-page and scroll-position screenshots: Chromateach https://nisshodenkiseigyo.com/chromateach/ and MY genius https://mygenius.jp/ (found through https://sankoudesign.com/category/lp/). Learned from section-specific visual storytelling, photo editing and concrete decision information, not copied layouts/assets/text. Reference screenshots stay local and are excluded from public assets.

Final second-pass QA: 1440/390 px full-page image and interaction checks; additional 320/768 px overflow checks. Screenshots in `qa-*.png`, `preview-*.png`, `editorial-*.png` are local evidence only. Used photos are explicitly illustrative and compressed to WebP. Text sizes in new explanatory sections were increased for readability, and photo/copy consistency manually inspected. Parent agent owns the final natural-japanese machine-lint pass and independent audit.
