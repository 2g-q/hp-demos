# AXIS TRAINING CLUB — original fitness concept

Created 2026-10-03 JST for ミナト AI・IT ラボ. Fictional gym website, not an actual fitness provider, client delivery or health outcome promise. Original typography/layout, wordmark, copy and implementation. No reference-site assets or source code copied.

## Photography

License verified against each free photo page and https://unsplash.com/license on 2026-10-02/03. These are not Unsplash+ images.

- `assets/training.webp`: Scott Webb, https://unsplash.com/photos/woman-on-gym-equipment-xwMlVSqP20U ; image `photo-1434682772747-f16d3ea162c3`.
- `assets/space.webp`: Abdul Raheem Kannath, https://unsplash.com/photos/an-empty-gym-with-a-lot-of-exercise-equipment-0Wdb7wzLMxo ; image `photo-1728486887318-398f1448f7ae`.
- `assets/dumbbell.webp`: Anastase Maragos, https://unsplash.com/photos/person-in-gray-shirt-holding-black-dumbbell-FP7cfYPPUKM ; source `photo-1583454110551-21f2fa2afe61`. Free Unsplash License verified on the source page 2026-10-03.
- `assets/coaching.webp`: TSquared Lab, https://unsplash.com/photos/woman-lunging-with-weight-while-trainer-supervises-JM4d2HPo4w4 ; source `photo-1663054129200-d3d6cfc3e691`. Free Unsplash License verified on source page 2026-10-03. Visible caption says illustrative stock photograph. No claim that this person is AXIS staff, a customer or endorses AXIS.
- Local resized WebP derivatives total approximately 220 KB. Raw JPGs retained as local source files, not required for deployment. People/places illustrate the concept and are not identified as AXIS staff/customers. Footer explicitly states this; incidental equipment marks do not imply endorsement. `assets/mobility.jpg` is a rejected/unused photo and should not be published.

## Content and functional QA

Eight sections: hero, philosophy, photo-linked selectable programs, first-session guide, selectable pricing, gym-space feature, FAQ, trial reservation preview. All pricing is visibly marked fictional sample pricing. No before-after, fabricated metrics, medical claims or testimonials. Second pass adds purpose-specific photography, warm pale sections, first-session steps and price choices instead of repeating a black text grid.

Accessible program tabs support left/right/Home/End, selected state and tabpanel association. Booking program follows selected program; local form confirms selected option/time, and explicitly says no booking/external submission occurred. No personal data fields, payment or storage.

Verified desktop 1440 and mobile 390 with headless Chrome for Testing from canonical chrome_bin. `../towa-corporate/qa.py` exercises menu/Escape, tab keyboard selection, modal selection/confirmation, reduced-motion scroll, image loading after page scroll, no overflow/broken images/JS errors/write requests. Evidence in `qa-results.json`, `qa-*.png`, `preview-*.png` (local QA, do not deploy these). Copy reviewed with natural-japanese quick.

Additional 320/768 px live checks: fixed a 1 px overflow in decorative program typography by making type size fluid; both widths now pass. Machine Japanese lint attempted, unavailable due to missing `sudachipy` in standard Python. Manual quick review complete; no lint-pass claim.

## Second design pass / 2026-10-03

Actual reference websites inspected in headless Chrome, full-page and scroll-position screenshots: Chromateach https://nisshodenkiseigyo.com/chromateach/ and MY genius https://mygenius.jp/ (found through https://sankoudesign.com/category/lp/). Learned from section-specific visual storytelling, photo editing and concrete decision information, not copied layouts/assets/text. Reference screenshots stay local and are excluded from public assets.

Final second-pass QA: 1440/390 px full-page image and interaction checks; additional 320/768 px overflow checks. Screenshots in `qa-*.png`, `preview-*.png`, `editorial-*.png` are local evidence only. Used photos are explicitly illustrative and compressed to WebP. Text sizes in new explanatory sections were increased for readability, and photo/copy consistency manually inspected. Parent agent owns the final natural-japanese machine-lint pass and independent audit.
