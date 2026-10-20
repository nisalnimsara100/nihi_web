-- Card theme for each account: a key into CARD_THEMES in src/lib/card-themes.ts.
alter table public."Account" add column "theme" text not null default 'indigo';

-- Until now the wallet page cycled indigo, lavender and midnight by position.
-- Give existing accounts the face they already had.
update public."Account" a
set "theme" = (array['indigo', 'lavender', 'midnight'])[(ranked.position % 3) + 1]
from (
  select "id", row_number() over (partition by "userId" order by "archived", "createdAt") - 1 as position
  from public."Account"
) ranked
where ranked."id" = a."id";
