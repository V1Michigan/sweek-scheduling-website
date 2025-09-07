# Supabase Sync Script

This Python script syncs company and student match data to your Supabase database.

## Setup

1. Create and activate a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate.fish  # For Fish shell
# OR
source venv/bin/activate       # For Bash/Zsh
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

**Note**: If you encounter compatibility issues, the script uses `supabase==2.0.2` for stability.

2. Set environment variables:

```bash
export SUPABASE_URL="your_supabase_project_url"
export SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"  # Recommended for admin operations
# OR
export SUPABASE_ANON_KEY="your_supabase_anon_key"  # Fallback, may have RLS restrictions
export APP_BASE_URL="https://your-domain.com"  # Optional, defaults to localhost:3000
```

**Important**: Use the `SUPABASE_SERVICE_ROLE_KEY` for admin operations like syncing data. The anon key may be restricted by Row Level Security (RLS) policies.

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
  stage text check (stage in ('assigned','accepted','scheduled','completed','declined','canceled','no_show'))
        not null default 'assigned',
  primary key (student_id, company_id)
);
```

## Usage

```bash
python sync_script.py company.csv student_matches.csv
```

## CSV Formats

### Companies CSV (`company.csv`)

Required columns: `name`
Optional columns: `blurb`, `looking_for`, `logo_slug`, `scheduling_url`

Example:

```csv
name,blurb,looking_for,logo_slug,scheduling_url
Acme Robotics,Leading robotics company,Software engineers,acme-robotics,https://calendly.com/acme
```

### Student Matches CSV (`student_matches.csv`)

#### Long Format

Columns: `email`, `name`, `company`, `tier`, `stage`

```csv
email,name,company,tier,stage
john@university.edu,John Doe,Acme Robotics,Top 10,assigned
john@university.edu,John Doe,TechCorp,Match,assigned
```

#### Wide Format (Top 10 Only)

Columns: `email`, `name`, `companies`

```csv
email,name,companies
john@university.edu,John Doe,Acme Robotics;TechCorp;DataFlow
```

**Note**: In wide format, all companies are automatically assigned "Top 10" tier since this CSV only contains the top matches.

## What the Script Does

1. **Upserts Companies**: Creates or updates companies with provided information
2. **Upserts Students**: Creates new students with random tokens, or uses existing tokens
3. **Replaces Matches**: Completely replaces each student's matches with CSV data
4. **Prints Magic Links**: Outputs magic links for emailing to students

## Magic Links

The script generates magic links in the format:

```
https://your-domain.com/s/{token}
```

These links allow students to access their personalized company matches page.

## Error Handling

- Missing companies in matches are skipped with warnings
- Invalid CSV formats are detected and reported
- Database errors are caught and displayed
- The script continues processing even if individual records fail

## Troubleshooting

### Row Level Security (RLS) Errors

If you get errors like `new row violates row-level security policy`, you need to use the service role key:

1. **Get your service role key** from your Supabase dashboard (Settings → API)
2. **Set the environment variable**:
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
   ```
3. **Re-run the script**

### Alternative: Disable RLS (Not Recommended for Production)

If you prefer to use the anon key, you can temporarily disable RLS:

```sql
ALTER TABLE sweek_companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE sweek_students DISABLE ROW LEVEL SECURITY;
ALTER TABLE sweek_matches DISABLE ROW LEVEL SECURITY;
```

## Sample Files

- `sample_companies.csv` - Example companies file
- `sample_student_matches_long.csv` - Example long format matches
- `sample_student_matches_wide.csv` - Example wide format matches
