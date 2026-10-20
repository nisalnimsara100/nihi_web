-- The order of accounts on the Wallet page, set by dragging. Lower numbers come first.
alter table public."Account" add column "sortOrder" integer not null default 0;

-- Keep today's order (oldest first) for existing accounts.
update public."Account" a
set "sortOrder" = ranked.position
from (
  select "id", row_number() over (partition by "userId" order by "createdAt") - 1 as position
  from public."Account"
) ranked
where ranked."id" = a."id";
