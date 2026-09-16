# Website example refresh

The owner requested quality- and demand-informed ordering and photo-led upgrades to weak website examples. This supersedes the earlier instruction to freeze all 11 website examples. Three examples were redesigned: corporate staffing, care recruitment, dental clinic. Existing conditions, interactive selectors and local-only confirmation forms are unchanged. All other website designs and all 21 non-website covers remain intact. Catalogue and individual-example return links lead to `cw-web.html`.

## Editorial order

Corporate staffing, care recruitment, architecture, dental clinic, accommodation, gym, salon, business-service LP, multilingual retail, EC purchase flow, pixel office.

This is an editorial priority, not a measured market-share ranking. Current/public posting examples used as demand signals:

- [Corporate design request](https://crowdworks.jp/public/jobs/13304028)
- [Recruitment website and job management request](https://crowdworks.jp/public/jobs/13055243)
- [Medical website and LP design request](https://crowdworks.jp/public/jobs/12780153)

Strong photo-led architecture/hotel/gym/salon examples are retained. Pixel art is retained as the brand symbol. The heading and description requested by the owner remain unchanged.

## Image provenance

Three images generated with the built-in image generation tool. These are photorealistic synthetic illustrations, not photographs of actual client staff or premises. Each hero carries a visible generation notice and descriptive alternative text. Original output was 1536×1024 PNG; project assets use WebP quality 88 without cropping. Generated assets are local to this repository, with no remote image dependency for the three renewed heroes.

### Care recruitment

Asset: `concept-assets/care-photo.webp`

Prompt: Use case: photorealistic-natural. Asset type: website hero photograph, landscape 3:2. Premium Japanese commercial editorial photography. A candid warm interaction between one Japanese female caregiver aged about 30 wearing a muted sage scrub top and one elderly Japanese woman aged about 75 seated in a bright contemporary lounge with garden greenery visible. Eye-level, respectful equal interaction, both subjects central/right with environmental context to left. Convincing real natural skin textures, authentic gentle expressions, anatomically natural hands, soft daylight. Actual photograph appearance, not illustration or CGI. No medical treatment, no text, no logos, no watermark.

### Dental clinic

Asset: `concept-assets/dental-photo.webp`

Prompt: Use case: photorealistic-natural. Asset type: website hero photograph, landscape 3:2. Premium architectural editorial photograph of an empty modern Japanese dental consultation and treatment room. Ivory dental chair, pale oak finishes, frosted glazing, abundant natural daylight, subtle teal accents. Dental equipment is physically credible and carefully composed, clean and inviting. Real photographic materials, lens perspective and light, polished but never CGI or illustration. No people, no branding, no text, no logos, no watermark.

### Corporate staffing

Asset: `concept-assets/corporate-photo.webp`

Prompt: Use case: photorealistic-natural. Asset type: staffing corporate website hero photograph, landscape 3:2. Premium Japanese commercial editorial photography. Two Japanese professionals, one woman aged about 30 and one man aged about 40, having a relaxed professional consultation at a wood table in a bright contemporary office. Smart casual navy and white clothing. Both visible central/right with office environmental context. Candid conversation rather than posing, no handshakes, natural anatomically correct hands, convincing real skin and natural daylight. Actual photograph appearance, not CGI or illustration. No readable papers or text, no logos, no watermark.

## Verification

`pf/verify_web_refresh.py` checks all 11 example views at desktop/mobile sizes and exercises the three updated demos, including no external form writes. `pf/capture_web_thumbnails.py` captures the actual 1440×900 website views for only those three thumbnail files. `pf/verify_real_portfolio.py` and `pf/verify_catalog_routes.py` preserve the 32-card catalogue inventory and its category navigation. Demo headings lose punctuation only; factual conditions and operation scripts are not rewritten. The three renewed catalogue cards now explicitly name their industries and describe the implemented flow. Japanese lint flagged only uniform short caption lengths; retained intentionally for consistent navigation and image disclosure.
