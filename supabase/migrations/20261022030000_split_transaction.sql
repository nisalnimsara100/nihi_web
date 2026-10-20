-- Splits one income or expense into several, each with its own amount, category and note. The
-- parts must add up to the original amount. The original is replaced by the parts in one step,
-- so a failure leaves everything as it was. Tags and the card carry over to every part.
-- p_parts is a JSON array of {"amount": <minor units>, "categoryId": "...", "note": "..."}.
create function public.split_transaction(p_user_id text, p_id text, p_parts jsonb)
returns text[]
language plpgsql set search_path = '' as $$
declare
  t public."Transaction"%rowtype;
  part jsonb;
  v_id text;
  v_ids text[] := '{}';
  v_sum bigint;
begin
  select * into t from public."Transaction" where "id" = p_id and "userId" = p_user_id for update;
  if not found then
    return null;
  end if;
  if t."type" = 'TRANSFER' then
    raise exception 'A transfer cannot be split';
  end if;
  if jsonb_typeof(p_parts) <> 'array' or jsonb_array_length(p_parts) < 2 then
    raise exception 'A split needs at least two parts';
  end if;
  select coalesce(sum((x ->> 'amount')::bigint), 0) into v_sum from jsonb_array_elements(p_parts) x;
  if v_sum <> t."amount" then
    raise exception 'The parts must add up to the original amount';
  end if;

  for part in select * from jsonb_array_elements(p_parts) loop
    insert into public."Transaction"
      ("userId", "type", "amount", "accountId", "categoryId", "date", "note", "cardId")
    values
      (t."userId", t."type", (part ->> 'amount')::integer, t."accountId", nullif(part ->> 'categoryId', ''),
       t."date", coalesce(part ->> 'note', t."note"), t."cardId")
    returning "id" into v_id;
    insert into public."TransactionTag" ("transactionId", "tagId")
    select v_id, "tagId" from public."TransactionTag" where "transactionId" = p_id;
    v_ids := v_ids || v_id;
  end loop;

  delete from public."Transaction" where "id" = p_id;
  return v_ids;
end;
$$;

revoke execute on function public.split_transaction(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.split_transaction(text, text, jsonb) to service_role;
