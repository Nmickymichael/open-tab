# OPEN TAB.

**YOUR WINDOW TO EVERYTHING INTERESTING.**

*A Mickoryn Media publication.*

OPEN TAB is an international digital publication covering sports, celebrities, creators, entertainment, technology, business, lifestyle, education, world affairs, video and opinion.

## Technology

- Next.js App Router + TypeScript
- Tailwind CSS v4
- Supabase Postgres, Auth, Row Level Security and Storage
- Supabase Edge Functions for public engagement endpoints
- Markdown + GitHub Flavored Markdown article rendering
- Privacy-enhanced YouTube embeds

## Local setup

1. Install Node.js 20.9 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Add the dedicated OPEN TAB Supabase project URL and anon key when the project is ready.
5. Run the SQL files in order in the Supabase SQL editor:
   - `supabase/schema.sql`
   - `supabase/migrations/20261118_open_tab_hardening.sql`
   - `supabase/migrations/20261118_engagement_limits.sql`
   - `supabase/migrations/20261118_editorial_audit.sql`
   - `supabase/migrations/20261118_video_publication_policy.sql`
   - `supabase/migrations/20261118_scheduled_publishing.sql`
   - `supabase/migrations/20261118_article_image_alt.sql`
6. Run `supabase/tests/rls_smoke_test.sql` and complete identity-based tests for anon, author, editor and admin roles.
7. Create staff accounts through a trusted administrator workflow. New accounts receive the author role only. Promote the first administrator manually from the Supabase SQL editor; never expose role assignment to public clients.
8. Run `npm run dev`.

## Editorial desk

Visit `/admin`. Public self-registration is disabled. Staff sign in with provisioned Supabase Auth accounts.

- **Authors:** create and edit their own draft/review articles.
- **Editors:** manage stories, video library, creators, dynamic departments, media, comment moderation, newsroom analytics and an administrator-only audit trail.
- **Administrators:** all editor capabilities plus newsletter audience access.

The dashboard supports article creation/editing, Markdown article bodies, publishing status, featured stories, SEO fields, video records, creator profiles, hierarchical categories, image uploads, comment moderation, newsletter audience management and database-backed headline/view counts.

## Media storage

The hardening migration creates a public-read `open-tab-media` bucket with an 8 MB image limit and an allowlist of image MIME types. Only editor/admin roles can upload, update or delete media. The browser uses the Supabase anon key and the database role policies; never put a service-role key in client-side code. Stories and videos can be scheduled from the CMS. The scheduler migration attempts to register a one-minute Supabase Cron job; verify that `open-tab-publish-scheduled-content` exists after migration, or configure `public.publish_scheduled_content()` to run every minute in Supabase Cron.

## Edge Functions

Deploy these functions to the dedicated Supabase project:

- `newsletter-subscribe` — validates and rate-limits signup requests, stores pending subscribers, and sends double opt-in confirmation.
- `newsletter-confirm` — confirms a subscription using its one-time token.
- `newsletter-unsubscribe` — processes one-click unsubscribe tokens.
- `comment-submit` — validates and rate-limits public comments before placing them in the moderation queue.
- `article-view` — records deduplicated story views through a trusted server-side endpoint.

Configure Edge Function secrets (never commit these values):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PUBLIC_SITE_URL` — exact public origin, e.g. `https://your-domain.example`
- `RATE_LIMIT_SALT` — long random secret used to hash source IP addresses
- `RESEND_API_KEY` — required for newsletter confirmation email
- `NEWSLETTER_FROM` — verified sender address for your email provider

The newsletter sender domain must be verified with the email provider. The subscription flow remains pending until a reader confirms their address. Public campaign sending is not included yet.

Deploy each function with the Supabase CLI after linking the dedicated project (the link step is intentionally deferred):

```bash
supabase functions deploy newsletter-subscribe
supabase functions deploy newsletter-confirm
supabase functions deploy newsletter-unsubscribe
supabase functions deploy comment-submit
supabase functions deploy article-view
```

The service-role key is used only inside Edge Function secrets.

## SEO and discoverability

The app includes dynamic sitemap generation, a robots policy, canonical story URLs, Open Graph/Twitter metadata, article/video metadata and NewsArticle structured data. Set `NEXT_PUBLIC_SITE_URL` to the real canonical domain before deployment so metadata and sitemap URLs use the correct origin.

## Security notes / launch checklist

This repository is a substantially expanded implementation, but it has **not yet been connected to a live Supabase project, deployed, or independently security-certified**. The GitHub Actions typecheck/build workflow is included, but a successful CI run has not yet been confirmed.

Before opening the site to the public:

- Run all SQL scripts in order and inspect the resulting policies.
- Create separate anonymous, author, editor and admin test accounts; verify every RLS path.
- Confirm the first admin role is assigned only through the trusted database owner workflow.
- Deploy Edge Functions and set secrets in the Supabase dashboard.
- Configure a verified newsletter sender domain and test confirmation/unsubscribe handling.
- Add CAPTCHA/Turnstile at the edge if comment/signup abuse warrants it; current Edge Functions include per-IP rate limits and server-side validation.
- Review privacy, terms, contact and editorial-policy pages with accurate publisher/contact details and legal advice appropriate to your operating jurisdiction.
- Configure backups, monitoring, error reporting, retention and incident response.
- Run the GitHub Actions typecheck/build workflow and resolve any failures.
- Test keyboard navigation, screen-reader labels, mobile layouts, image alt text, page performance and Core Web Vitals.
- Use only media you own, have licensed, or are authorised to embed. Video entries use YouTube's privacy-enhanced embed host.

## What remains intentionally separate

**Supabase project connection and live website deployment are being left for the owner**, as requested. No project credentials, service-role secrets, domain, or deployment target are stored in this repository.

## Editorial departments

Home · Sports · Celebrities · Creators · Entertainment · Technology · Business · Lifestyle · Education · World · Videos · Opinions.

Categories and subcategories are database-managed and can be created from the editorial desk.

© 2026 Mickoryn. All rights reserved.
