# OPEN TAB.

**Your Window to Everything Interesting.**

A Mickoryn Media publication.

OPEN TAB is an international digital media publication covering sports, celebrities, creators, entertainment, technology, business, lifestyle, education, world news, videos and opinions.

## Project status

The repository is being built as a real publication platform using Next.js, TypeScript, Tailwind CSS and Supabase. The editorial system is designed for dynamic categories, authenticated publishing, and public pages that only expose published content.

## Planned stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase Postgres, Auth and Storage
- Official YouTube embeds for third-party video
- GitHub for source control

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Configure the Supabase URL and anon key in `.env.local` before using backend features. Never expose a Supabase service-role key in browser code.

## Editorial departments

Home · Sports · Celebrities · Creators · Entertainment · Technology · Business · Lifestyle · Education · World · Videos · Opinions

New categories and subcategories should be created from the CMS rather than hard-coded into navigation.

© 2026 Mickoryn. All rights reserved.
