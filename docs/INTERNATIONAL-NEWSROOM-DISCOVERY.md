# OPEN TAB international discovery and visual desk

## Discovery network
- The publisher registry in `src/lib/global-news-sources.ts` spans Africa, Europe, Asia-Pacific, South Asia, the Middle East, North America and Latin America.
- Category RSS sources continue to use Next.js's 10-minute revalidation cache.
- GDELT DOC API is queried server-side for relevant categories and cached for 10 minutes. It is a discovery index, not an editorial authority.
- NewsData.io is an optional secondary discovery source. Add `NEWSDATA_API_KEY` only to the Netlify server environment (never a `NEXT_PUBLIC_*` variable). Without the key, the app skips this provider and continues normally.
- Existing hourly YouTube discovery remains hourly; the country sample now spans 29 markets. The existing multi-market threshold and duplicate video check remain in place.

## Verification and duplicates
- RSS, GDELT and NewsData results are discovery leads. They are not automatically verified facts and should not be treated as ready-to-publish articles.
- URL canonicalization removes common tracking parameters and fragments.
- Similar headlines are clustered using token overlap; clustered publisher names are retained as corroborating-source metadata.
- A multi-source cluster is a signal to compare reports, not proof that the underlying claim is true. Editors must open the original reports, check publication time, geography, primary documents and independent confirmation, and record any uncertainty before publishing.
- Do not copy full publisher articles. Write original reporting or concise summaries with source links and proper attribution.

## Image and licensing policy
- Feed images and article Open Graph images are candidate visuals only. A valid URL does not establish reuse rights.
- Missing or failed images continue to fall back to the site's designed OPEN TAB illustrative artwork. Never label generated/illustrative artwork as documentary photography.
- Record photographer/agency credit, original image source and licence/permission details in the editorial desk before using third-party photography.
- The initial branded graphic templates are in `public/editorial-graphics/`: breaking news, world brief, entertainment and sports. They are reusable starting points, not substitutes for event-specific licensed photography.

## Performance and deployment
- Provider requests run in parallel with bounded timeouts and Next.js server-side revalidation; NewsData is skipped when no key is configured.
- No new Supabase tables, migrations, scheduled jobs or browser-side API keys are required for this discovery milestone.
- The hourly YouTube job remains hourly; no extra cron frequency has been introduced.
- Run `npm run typecheck` and `npm run build` in CI after deployment. Confirm Netlify production status separately; a GitHub commit alone does not prove a successful production deploy.
