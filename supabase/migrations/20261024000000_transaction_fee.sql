-- An optional fee on an expense or a transfer (bank charge, transfer fee). It is charged to the
-- account the money leaves, on top of the amount, and counts as spending: it is part of the
-- month's expense total, and of the expense's category. A transfer has no category, so its
-- fee shows under "Uncategorized". Income has no fee.
alter table public."Transaction"
  add column "fee" integer not null default 0,
  add constraint "Transaction_fee_check" check ("fee" >= 0 and ("type" <> 'INCOME' or "fee" = 0));

-- Net change per account: the source account loses the amount and the fee.
create or replace function public.account_balance_deltas(p_user_id text)
returns table ("accountId" text, "delta" bigint)
language sql stable set search_path = '' as $$
  select id, sum(change)::bigint
  from (
    select t."accountId" as id, case when t."type" = 'INCOME' then t."amount" else -(t."amount" + t."fee") end as change
    from public."Transaction" t
    where t."userId" = p_user_id
    union all
    select t."toAccountId", coalesce(t."toAmount", 0)
    from public."Transaction" t
    where t."userId" = p_user_id and t."type" = 'TRANSFER' and t."toAccountId" is not null
  ) moves
  group by id;
$$;

-- Income and expense per currency in [p_start, p_end). A transfer counts only for its fee.
create or replace function public.totals_by_currency(p_user_id text, p_start timestamptz, p_end timestamptz)
returns table ("currency" text, "income" bigint, "expense" bigint)
language sql stable set search_path = '' as $$
  select a."currency",
    coalesce(sum(t."amount") filter (where t."type" = 'INCOME'), 0)::bigint,
    coalesce(sum(case when t."type" = 'EXPENSE' then t."amount" + t."fee" else t."fee" end)
      filter (where t."type" in ('EXPENSE', 'TRANSFER')), 0)::bigint
  from public."Transaction" t
  join public."Account" a on a."id" = t."accountId"
  where t."userId" = p_user_id
    and (t."type" in ('INCOME', 'EXPENSE') or t."fee" > 0)
    and t."date" >= p_start and t."date" < p_end
  group by a."currency";
$$;

-- Totals per category for one type and currency in [p_start, p_end). Uncategorized transactions
-- come back with a null category. For expenses, the fees of transfers are included there.
create or replace function public.category_breakdown(
  p_user_id text, p_type public."TransactionType", p_currency text, p_start timestamptz, p_end timestamptz
)
returns table ("id" text, "name" text, "color" text, "icon" text, "total" bigint, "count" bigint)
language sql stable set search_path = '' as $$
  select c."id", c."name", c."color", c."icon",
    sum(case when t."type" = 'TRANSFER' then t."fee" else t."amount" + t."fee" end)::bigint, count(*)
  from public."Transaction" t
  join public."Account" a on a."id" = t."accountId"
  left join public."Category" c on c."id" = t."categoryId"
  where t."userId" = p_user_id
    and (t."type" = p_type or (p_type = 'EXPENSE' and t."type" = 'TRANSFER' and t."fee" > 0))
    and a."currency" = p_currency
    and t."date" >= p_start and t."date" < p_end
  group by c."id";
$$;

-- Income and expense per "YYYY-MM" month in [p_start, p_end), in one currency.
create or replace function public.monthly_totals(p_user_id text, p_currency text, p_start timestamptz, p_end timestamptz)
returns table ("month" text, "income" bigint, "expense" bigint)
language sql stable set search_path = '' as $$
  select to_char(t."date" at time zone 'UTC', 'YYYY-MM'),
    coalesce(sum(t."amount") filter (where t."type" = 'INCOME'), 0)::bigint,
    coalesce(sum(case when t."type" = 'EXPENSE' then t."amount" + t."fee" else t."fee" end)
      filter (where t."type" in ('EXPENSE', 'TRANSFER')), 0)::bigint
  from public."Transaction" t
  join public."Account" a on a."id" = t."accountId"
  where t."userId" = p_user_id
    and (t."type" in ('INCOME', 'EXPENSE') or t."fee" > 0)
    and a."currency" = p_currency
    and t."date" >= p_start and t."date" < p_end
  group by 1;
$$;

-- save_transaction takes the fee (0 for none).
drop function public.save_transaction(text, text, public."TransactionType", integer, text, text, integer, text, timestamptz, text, text[], text);

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
  p_card_id text,
  p_fee integer
)
returns text
language plpgsql set search_path = '' as $$
declare
  v_id text;
begin
  if p_id is null then
    insert into public."Transaction"
      ("userId", "type", "amount", "fee", "accountId", "toAccountId", "toAmount", "categoryId", "date", "note", "cardId")
    values
      (p_user_id, p_type, p_amount, coalesce(p_fee, 0), p_account_id, p_to_account_id, p_to_amount, p_category_id, p_date, p_note, p_card_id)
    returning "id" into v_id;
  else
    update public."Transaction"
    set "type" = p_type, "amount" = p_amount, "fee" = coalesce(p_fee, 0), "accountId" = p_account_id,
        "toAccountId" = p_to_account_id, "toAmount" = p_to_amount, "categoryId" = p_category_id,
        "date" = p_date, "note" = p_note, "cardId" = p_card_id
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

revoke execute on function public.save_transaction(text, text, public."TransactionType", integer, text, text, integer, text, timestamptz, text, text[], text, integer) from public, anon, authenticated;
grant execute on function public.save_transaction(text, text, public."TransactionType", integer, text, text, integer, text, timestamptz, text, text[], text, integer) to service_role;

-- Splitting an expense keeps its fee, on the first part.
create or replace function public.split_transaction(p_user_id text, p_id text, p_parts jsonb)
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
      ("userId", "type", "amount", "fee", "accountId", "categoryId", "date", "note", "cardId")
    values
      (t."userId", t."type", (part ->> 'amount')::integer, case when v_ids = '{}' then t."fee" else 0 end,
       t."accountId", nullif(part ->> 'categoryId', ''), t."date", coalesce(part ->> 'note', t."note"), t."cardId")
    returning "id" into v_id;
    insert into public."TransactionTag" ("transactionId", "tagId")
    select v_id, "tagId" from public."TransactionTag" where "transactionId" = p_id;
    v_ids := v_ids || v_id;
  end loop;

  delete from public."Transaction" where "id" = p_id;
  return v_ids;
end;
$$;
