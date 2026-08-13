-- Tool email gate leads (W2, program maker onward).
-- Service-role writes only. No client access. RLS on, zero policies —
-- the anon/authenticated roles can neither read nor write this table.
-- Apply via the supabase-api skill after imy-supabase-security-audit review.

create table if not exists public.tool_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  tool text not null default '',
  variant text not null default '',
  created_at timestamptz not null default now()
);

alter table public.tool_leads enable row level security;
alter table public.tool_leads force row level security;

-- Intentionally no policies: service_role bypasses RLS; everyone else is shut out.

create index if not exists tool_leads_created_at_idx on public.tool_leads (created_at desc);
create index if not exists tool_leads_email_idx on public.tool_leads (email);
