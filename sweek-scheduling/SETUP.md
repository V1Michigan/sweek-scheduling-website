# Sweek Scheduling Website Setup

## Environment Variables

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema

The application expects the following database tables in Supabase:

### Companies Table

```sql
create table sweek_companies(
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  blurb text,
  looking_for text,
  logo_slug text,                      -- e.g., 'acme-robotics' → /public/logos/acme-robotics.png
  scheduling_url text not null,
  is_active boolean default true
);
```

### Students Table

```sql
create table sweek_students(
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  token_hash text not null,
  token text not null,                 -- keep plaintext token to export easily
  is_active boolean default true
);
```

### Matches Table

```sql
create table sweek_matches(
  student_id uuid references sweek_students(id) on delete cascade,
  company_id uuid references sweek_companies(id) on delete cascade,
  tier text check (tier in ('Top 10','Match')) not null default 'Match',
  stage text check (stage in ('pending','accepted','rejected','scheduled','completed','declined','canceled','no_show'))
        not null default 'pending',
  primary key (student_id, company_id)
);
```

## Usage

1. Install dependencies: `npm install`
2. Set up your Supabase project and create the tables above
3. Add your environment variables to `.env.local`
4. Add company logos to `/public/logos/` directory (e.g., `acme-robotics.png`)
5. Run the development server: `npm run dev`

## Dynamic Route

The application provides a dynamic route at `/s/[token]` where:

- `[token]` is the student's authentication token
- The token is hashed with SHA-256 and used to look up the student
- If the student is found and active, their company matches are displayed
- Companies are sorted with "Top 10" tier first
- Each company card shows logo, name, blurb, "looking for" text, badges, and scheduling button

## Features

- ✅ Token-based authentication with SHA-256 hashing
- ✅ Company match display with logos and badges
- ✅ "Top 10" tier prioritization
- ✅ Stage badges (optional)
- ✅ Direct scheduling links
- ✅ Error handling for invalid/inactive tokens
- ✅ Responsive design with Tailwind CSS
- ✅ Fallback placeholder for missing logos
