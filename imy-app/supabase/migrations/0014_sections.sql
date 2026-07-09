-- 0014 · the page in the family's order.
-- One sections object per tribute: order (the rooms, in their sequence) and
-- hidden (rooms resting for now). Absent means the design's narrative arc,
-- untouched — so every existing page renders exactly as before.

alter table public.tributes
  add column if not exists sections jsonb;

notify pgrst, 'reload schema';
