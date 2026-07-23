-- 0024 · a canceled monthly trial rests Plus without taking the memorial down.
-- The subscription row remains in the ledger. Full films and sponsor words stay
-- kept privately, and another paid entitlement keeps the page open.

create or replace function public.rest_plus_after_subscription_end(p_subscription_id text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid;
begin
  if nullif(trim(p_subscription_id), '') is null then
    raise exception 'subscription-id-required';
  end if;

  update public.subscriptions
     set status = 'canceled'
   where stripe_subscription_id = p_subscription_id
   returning tribute_id into tid;

  if tid is null then
    return null;
  end if;

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
       and stripe_subscription_id <> p_subscription_id
       and status in ('trialing', 'active', 'past_due')
  ) then
    update public.tributes
       set tier = 'free'
     where id = tid
       and tier in ('plus', 'heirloom', 'eternal');
  end if;

  return tid;
end;
$$;

revoke execute on function public.rest_plus_after_subscription_end(text) from public, anon, authenticated;
grant execute on function public.rest_plus_after_subscription_end(text) to service_role;

notify pgrst, 'reload schema';
