-- 0026 · Item 7: the hero quote slot carries Eleanor's OWN words, not the
-- generic line. Her words come from the message she left her family in the
-- seed content (0003, message_from_them) — nothing is invented for her.
-- Additive data correction to the seeded demo tribute only.
update public.tributes
set portrait_quote = 'Put the kettle on, sit in the garden, and notice something lovely. I''ll be in all of it.'
where slug = 'eleanor'
  and portrait_quote = 'Find the smallest beautiful thing in the day, and tell someone about it.';

notify pgrst, 'reload schema';
