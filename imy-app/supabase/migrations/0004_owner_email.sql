-- Add owner_email to tributes (guest-create capture + claim/notify by email)
alter table public.tributes add column if not exists owner_email text;
create index if not exists tributes_owner_email_idx on public.tributes(owner_email);
