-- 1. A transaction and its card are saved in one step (they used to be two).
drop function public.save_transaction(text, text, public."TransactionType", integer, text, text, integer, text, timestamptz, text, text[]);

create function public.save_transaction(
  p_user_id text,
  p_id text,
  p_type public."TransactionType",
  p_amount integer,
  p_account_id text,
  p_to_account_id text,
  p_to_amount integer,
  p_category_id text,
  p_date timestamptz,
  p_note text,
  p_tag_ids text[],
  p_card_id text
)
returns text
language plpgsql set search_path = '' as $$
declare
  v_id text;
begin
  if p_id is null then
    insert into public."Transaction"
      ("userId", "type", "amount", "accountId", "toAccountId", "toAmount", "categoryId", "date", "note", "cardId")
    values
      (p_user_id, p_type, p_amount, p_account_id, p_to_account_id, p_to_amount, p_category_id, p_date, p_note, p_card_id)
    returning "id" into v_id;
  else
    update public."Transaction"
    set "type" = p_type, "amount" = p_amount, "accountId" = p_account_id, "toAccountId" = p_to_account_id,
        "toAmount" = p_to_amount, "categoryId" = p_category_id, "date" = p_date, "note" = p_note, "cardId" = p_card_id
    where "id" = p_id and "userId" = p_user_id
    returning "id" into v_id;
    if v_id is null then
      return null;
    end if;
    delete from public."TransactionTag" where "transactionId" = v_id;
  end if;

  insert into public."TransactionTag" ("transactionId", "tagId")
  select v_id, tag_id from unnest(coalesce(p_tag_ids, '{}')) as tag_id;
  return v_id;
end;
$$;

revoke execute on function public.save_transaction(text, text, public."TransactionType", integer, text, text, integer, text, timestamptz, text, text[], text) from public, anon, authenticated;
grant execute on function public.save_transaction(text, text, public."TransactionType", integer, text, text, integer, text, timestamptz, text, text[], text) to service_role;

-- 2. Partner invite links expire. Accepted shares ignore this date.
alter table public."PartnerShare"
  add column "expiresAt" timestamptz not null default (now() + interval '7 days');
