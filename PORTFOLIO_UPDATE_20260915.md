# CW portfolio thumbnail refresh

- Scope: `cw.html` only. Replace 21 placeholder/older thumbnails with original lightweight SVG illustrations in `pf/editorial/`.
- Preserve the 11 existing website/pixel-office/banner covers, including the architecture and accommodation examples the owner likes.
- Each new cover has a subject-specific composition and palette. Existing card titles, descriptions, ordering, links and target attributes are unchanged.
- Reference: https://x.com/gimu_ai/status/2098391932955459743 links to the official OpenAI showcase. Reference for visual variety, not copied artwork.
- Regenerate artwork with `python3 pf/build_editorial.py` from the repository root. No external asset or font dependency.
- Local Chromium checks: all 32 card images loaded; no horizontal overflow at 1440, 390 and 360 px; no page errors. Compare card href, target and body text against the base commit.
- The portfolio preview illustration is not a screenshot or evidence of delivered client work. Keep the destination demos as the functional examples.
