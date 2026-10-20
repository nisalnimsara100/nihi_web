-- Which card network a linked card belongs to, so two cards that end in the same
-- four digits can be told apart (and so the card list can show Visa, Mastercard, ...).
-- Keys match CARD_NETWORKS in src/lib/card-networks.ts.
alter table public."Card"
  add column "network" text not null default 'OTHER'
  check ("network" in ('VISA', 'MASTERCARD', 'AMEX', 'UNIONPAY', 'JCB', 'OTHER'));

-- A card is now identified by account + network + last four digits.
alter table public."Card" drop constraint "Card_accountId_last4_key";
alter table public."Card" add constraint "Card_accountId_network_last4_key" unique ("accountId", "network", "last4");
