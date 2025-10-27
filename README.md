## Tiny Box

Tiny Box is a Supabase-backed file sharing app built with Next.js 14 (App Router), React, Tailwind CSS, and shadcn-inspired components. Users can upload files into Supabase Storage, control visibility with a one-click public toggle, and generate unique share links with optional email notes.

### Features

- One-time passcode (OTP) authentication using Supabase Auth.
- Upload files directly into the `files` storage bucket.
- Toggle public/private visibility; public files expose a permanent URL.
- Private files support unique share links that generate expiring signed URLs.
- Share dialog includes copy-to-clipboard controls and one-click Resend emails to recipients.
- Dedicated `/share/[token]` page for recipients to download shared content.

### Tech Stack

- Next.js 14 App Router + TypeScript
- Supabase (Auth, Storage, Postgres)
- Tailwind CSS with custom violet theme accents
- shadcn/ui primitives (Radix UI, `class-variance-authority`)
- Server Actions for uploads, visibility toggles, and share management

## Getting Started

### 1. Prerequisites

- Node.js 18.18+ (or any version supported by Next.js 14)
- A Supabase project with API keys and Storage enabled
- npm (bundled with Node.js)

### 2. Environment variables

Copy `.env.example` to `.env.local` and adjust if needed:

```bash
cp .env.example .env.local
```

Required variables:

```ini
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=Tiny Box <hello@example.com>
```

`NEXT_PUBLIC_APP_URL` is used as a fallback when generating share links outside of a request (e.g., local development).
`SUPABASE_SERVICE_ROLE_KEY` enables the share page to securely resolve file metadata and generate signed URLs without failing on row-level security. If you prefer not to expose the service role key to your hosting provider, remove the variable and ensure every shared file is public.
`RESEND_API_KEY` and `RESEND_FROM_EMAIL` power share-link notification emails triggered from the dashboard. Use a verified domain/sender from your Resend workspace for the from address.

### 3. Database schema

Create the tables required for file metadata and share links inside your Supabase project:

```sql
create table if not exists public.files (
	id uuid primary key default gen_random_uuid(),
	owner_id uuid references auth.users(id) on delete cascade,
	name text not null,
	path text not null unique,
	size bigint not null,
	mime_type text,
	is_public boolean not null default false,
	public_url text,
	created_at timestamptz not null default now()
);

create table if not exists public.file_shares (
	id uuid primary key default gen_random_uuid(),
	file_id uuid references public.files(id) on delete cascade,
	owner_id uuid references auth.users(id) on delete cascade,
	owner_email text,
	owner_name text,
	token text not null unique,
	share_email text,
	created_at timestamptz not null default now()
);

create index if not exists file_shares_file_id_idx on public.file_shares(file_id);

-- Enable RLS and allow owners to manage their data
alter table public.files enable row level security;
alter table public.file_shares enable row level security;

create policy if not exists "Owners manage file rows" on public.files
	for all
	using (auth.uid() = owner_id)
	with check (auth.uid() = owner_id);

create policy if not exists "Public files are viewable" on public.files
	for select
	using (is_public or auth.uid() = owner_id);

create policy if not exists "Owners manage share links" on public.file_shares
	for all
	using (auth.uid() = owner_id)
	with check (auth.uid() = owner_id);

create policy if not exists "Share tokens can be resolved" on public.file_shares
	for select
	using (token is not null);

-- Storage policies for the `files` bucket
create policy if not exists "Users manage their objects" on storage.objects
	for all
	using (bucket_id = 'files' and owner = auth.uid())
	with check (bucket_id = 'files' and owner = auth.uid());

create policy if not exists "Public files readable" on storage.objects
	for select
	using (
		bucket_id = 'files'
		and (
			owner = auth.uid()
			or exists (
				select 1
				from public.files f
				where f.path = name
				and f.is_public
			)
		)
	);
```

If you created the `file_shares` table before the owner metadata columns were introduced, add them with:

```sql
alter table public.file_shares add column if not exists owner_email text;
alter table public.file_shares add column if not exists owner_name text;
```

In Supabase Storage, create a bucket named `files` and enable public access **only if you intend to allow public file URLs**. The app relies on Storage Row Level Security, so keep your Storage policies aligned with your sharing strategy.

### 4. Install dependencies and run locally

```bash
npm install
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### 5. Supabase Auth configuration

- Enable Email OTP auth in Supabase (the default email template sends a 6-digit code).
- Update the Site URL in Supabase Auth settings to `http://localhost:3000` (or your deployed domain) so that email links and deep links open in your app if you later enable them.

## Available scripts

- `npm run dev` – start the local development server
- `npm run build` – build the production bundle
- `npm run start` – run the production server locally
- `npm run lint` – run ESLint

## Project structure highlights

- `src/app` – App Router routes (`/`, `/sign-in`, `/dashboard`, `/share/[token]`)
- `src/app/dashboard/actions.ts` – server actions for upload, toggle, share, and delete workflows
- `src/components` – UI primitives and dashboard widgets (uploader, table, dialog)
- `src/lib/supabase` – server/browser Supabase client factories

## Deployment notes

When deploying, ensure environment variables are configured in your hosting provider. The Supabase Storage bucket and database tables must be created before running the production build. Share links rely on `NEXT_PUBLIC_APP_URL`, so set it to your canonical domain (e.g., `https://app.example.com`).

## Testing the flow

1. Visit `/sign-up`, provide your first and last name along with an email address, and submit the form.
2. Confirm your email by clicking the link in your inbox; you&apos;ll land back in the app signed in.
3. Sign out and return via `/sign-in` to request an OTP, then verify the code to re-enter.
4. Upload a file from the dashboard, manage visibility, and generate share links to test access rules.

Enjoy building on Tiny Box! Feel free to adapt the UI or extend the Supabase schema to fit your sharing model.
