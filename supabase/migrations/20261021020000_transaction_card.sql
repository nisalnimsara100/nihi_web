-- Which card paid for (or received) a transaction. The money still moves on the card's
-- account; this only records the card used. Deleting a card keeps its transactions.
alter table public."Transaction"
  add column "cardId" text references public."Card" ("id") on delete set null;
create index "Transaction_cardId_idx" on public."Transaction" ("cardId");
