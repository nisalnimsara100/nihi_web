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
-- A monthly spending limit for one expense category, in one currency. Spending is counted from
-- accounts in that currency. Amounts are minor units (cents), like the rest of the schema.
create table public."Budget" (
  "id" text primary key default gen_random_uuid()::text,
  "userId" text not null references public."User" ("id") on delete cascade,
  "categoryId" text not null references public."Category" ("id") on delete cascade,
  "currency" text not null,
  "amount" integer not null check ("amount" > 0),
  "createdAt" timestamptz not null default now(),
  unique ("userId", "categoryId", "currency")
);
create index "Budget_userId_idx" on public."Budget" ("userId");
alter table public."Budget" enable row level security;
-- Repeating transactions (rent, salary, subscriptions, card payments). A rule never adds
-- anything by itself: when "nextDate" arrives the app lists it as due, and the user confirms
-- (adds it) or skips it. Either way "nextDate" moves on to the following occurrence.
create table public."Recurring" (
  "id" text primary key default gen_random_uuid()::text,
  "userId" text not null references public."User" ("id") on delete cascade,
  "type" public."TransactionType" not null,
  "amount" integer not null check ("amount" > 0),
  "toAmount" integer check ("toAmount" is null or "toAmount" > 0),
  "accountId" text not null references public."Account" ("id") on delete cascade,
  "toAccountId" text references public."Account" ("id") on delete cascade,
  "categoryId" text references public."Category" ("id") on delete set null,
  "note" text not null default '',
  "frequency" text not null check ("frequency" in ('WEEKLY', 'MONTHLY', 'YEARLY')),
  -- Day of the month the rule started on, so a rule that begins on the 31st keeps coming back
  -- on the last day of shorter months and returns to the 31st afterwards.
  "anchorDay" smallint not null check ("anchorDay" between 1 and 31),
  -- The next occurrence waiting to be added or skipped.
  "nextDate" date not null,
  "endDate" date,
  "active" boolean not null default true,
  "createdAt" timestamptz not null default now()
);
create index "Recurring_userId_idx" on public."Recurring" ("userId", "active", "nextDate");
alter table public."Recurring" enable row level security;
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
-- A savings goal: "save Rs. 100,000 by December". Progress is the balance of a linked savings
-- account, or, without a link, the amount the user has put in by hand ("savedAmount").
create table public."SavingsGoal" (
  "id" text primary key default gen_random_uuid()::text,
  "userId" text not null references public."User" ("id") on delete cascade,
  "name" text not null,
  "currency" text not null,
  "targetAmount" integer not null check ("targetAmount" > 0),
  "targetDate" date,
  "accountId" text references public."Account" ("id") on delete set null,
  "savedAmount" integer not null default 0 check ("savedAmount" >= 0),
  "createdAt" timestamptz not null default now()
);
create index "SavingsGoal_userId_idx" on public."SavingsGoal" ("userId");
alter table public."SavingsGoal" enable row level security;
