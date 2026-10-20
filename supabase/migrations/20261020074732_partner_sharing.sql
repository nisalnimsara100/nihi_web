-- Read-only partner access. An owner invites an email; the partner accepts with
-- the secret token from the invite link while signed in with that email.
create table public."PartnerShare" (
  "id" text primary key default gen_random_uuid()::text,
  "ownerId" text not null references public."User" ("id") on delete cascade,
  -- Invited address, lowercased.
  "email" text not null,
  -- Secret in the invite link. NiHi does not verify emails, so accepting needs
  -- this as well as a signed-in account with the invited email.
  "token" text not null unique,
  -- Set when the invite is accepted.
  "partnerId" text references public."User" ("id") on delete cascade,
  "createdAt" timestamptz not null default now(),
  "acceptedAt" timestamptz,
  unique ("ownerId", "email")
);
create index "PartnerShare_partnerId_idx" on public."PartnerShare" ("partnerId");

alter table public."PartnerShare" enable row level security;
