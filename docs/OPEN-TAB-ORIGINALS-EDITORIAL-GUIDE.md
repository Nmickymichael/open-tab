# OPEN TAB Originals — Editorial Format

Use this standard for every new original Mickoryn Media feature, explainer, guide, interview or analysis.

## Article structure
- Write a specific, bold headline and a short deck that tells readers why the story matters.
- Keep the byline visible: **Mickey Me · A Mickoryn Media Publication** (or the confirmed author for that piece).
- Open with the main takeaway, then organize the story into descriptive H2/H3 sections.
- Use fresh reporting and original wording. Do not copy source language or produce close sentence-by-sentence rewrites.
- Prefer concise paragraphs, useful context, accurate attribution and clear distinctions between confirmed facts, estimates and analysis.
- Build a logical progression: main takeaway, key details, supporting evidence/visual clues, implications and what happens next.
- Link to primary sources naturally within the relevant paragraphs or captions. Do not append a generic “REPORTING & SOURCE NOTES” block or the boilerplate “This is an original Mickoryn Media article written for OPEN TAB...” disclaimer.
- Finish with a clean author/publication byline and useful related-story navigation.

## Images and graphics
- Plan at least three visual moments across the feature where the material supports them: a lead image plus supporting photos, charts, maps, timelines, diagrams or data cards placed beside the relevant sections.
- Use only images/graphics with verified rights, a suitable licence or permission. Credit the creator/rights holder and link to the source where available; attribution alone is not permission.
- Use the reusable `EditorialFigure` component for sourced images. It uses `FeedImage`, which displays the exact fallback text **STORY IMAGE UNAVAILABLE** if an image is missing or fails.
- Do not invent image credits, licences, statistics or visual evidence. Label estimates and third-party measurements clearly.
- Use original CSS/SVG/HTML graphics when a clear data visual is more useful than another photograph. Include a short caption explaining the data and its limitations.

## Page experience and performance
- Keep the article readable on mobile, with a clear heading hierarchy and scannable paragraphs.
- Use the global smooth-scroll behavior and scroll offsets; give in-article anchor targets a scroll margin so headings are not obscured.
- Reuse already-loaded article/feed data. Do not add Supabase queries, tables, polling or extra refresh work just to render article visuals.
- Preserve metadata, canonical URL, accessible image alt text and existing internal navigation.
