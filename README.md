# OPEN TAB.

**Your Window to Everything Interesting.**

*A Mickoryn Media publication.*

An international digital media publication covering sports, celebrities, creators, entertainment, technology, business, lifestyle, education, world affairs, videos and opinions.

## Stack
- Next.js App Router + TypeScript
- Tailwind CSS v4
- Supabase Postgres, Auth and Storage
- Official YouTube embeds

## Local setup
1. Install Node.js 20.9+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and add your Supabase project URL and anon key.
4. Review and run `supabase/schema.sql` in a dedicated Supabase project.
5. Create a trusted Auth user. The database trigger creates a profile with the author role. Promote the first administrator manually from the Supabase SQL editor; never expose role assignment to public clients.
6. Run `npm run dev`.

## Current implementation
The repository contains the initial public-facing Next.js site, all requested department routes, story and video detail routes, a basic search page, an editorial sign-in entry point, shared branding components and an initial Supabase schema.

## Required before production
This is an initial implementation milestone, not production-ready certification. The full protected CMS CRUD/editor, secure role provisioning workflow, media storage policies, newsletter confirmation/unsubscribe, comment spam controls and rate limits, complete legal policies, error monitoring, backups, accessibility audit, sitemap/robots, deployment configuration and end-to-end security testing remain to be completed. Verify RLS with anonymous, author, editor and admin accounts. Never expose a Supabase service-role key in browser code.

## Editorial departments
Home · Sports · Celebrities · Creators · Entertainment · Technology · Business · Lifestyle · Education · World · Videos · Opinions.

Categories and subcategories are database-managed and are not limited to this initial list.

© 2026 Mickoryn. All rights reserved.
