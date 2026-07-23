-- 0023 · a full refund rests Plus without taking the memorial or its film away.
-- The order remains in the ledger. The page returns to Free only when no other
-- paid entitlement remains; the woven film and sponsor words stay kept, at rest.

create or replace function public.rest_plus_after_full_refund(p_payment_intent text)
returns setof uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid;
begin
  if nullif(trim(p_payment_intent), '') is null then
    raise exception 'payment-intent-required';
  end if;

  update public.orders
     set status = 'refunded',
         fulfillment_status = 'not_applicable',
         fulfillment_error = null
   where stripe_payment_intent = p_payment_intent;

  for tid in
    select distinct tribute_id
      from public.orders
     where stripe_payment_intent = p_payment_intent
       and tribute_id is not null
  loop
    -- Serialize entitlement changes for this one memorial. A concurrent checkout
    -- either becomes visible before this check or writes Plus after this lock.
    perform 1 from public.tributes where id = tid for update;

    if not exists (
      select 1
        from public.orders
       where tribute_id = tid
         and status = 'paid'
         and kind in ('plus_once', 'family_unlock', 'heirloom', 'eternal')
    ) and not exists (
      select 1
        from public.subscriptions
       where tribute_id = tid
         and status in ('trialing', 'active', 'past_due')
    ) then
      update public.tributes
         set tier = 'free'
       where id = tid
         and tier in ('plus', 'heirloom', 'eternal');
    end if;

    return next tid;
  end loop;
end;
$$;

revoke execute on function public.rest_plus_after_full_refund(text) from public, anon, authenticated;
grant execute on function public.rest_plus_after_full_refund(text) to service_role;

notify pgrst, 'reload schema';
