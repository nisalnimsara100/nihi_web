-- Up to 5 optional images per transaction (receipts, bills). The files live on Cloudinary;
-- this table keeps the delivery URL and the public id needed to delete a file later.
create table public."TransactionImage" (
  "id" text primary key default gen_random_uuid()::text,
  "transactionId" text not null references public."Transaction" ("id") on delete cascade,
  "userId" text not null references public."User" ("id") on delete cascade,
  "url" text not null,
  "publicId" text not null,
  "createdAt" timestamptz not null default now()
);
create index "TransactionImage_transactionId_idx" on public."TransactionImage" ("transactionId");
alter table public."TransactionImage" enable row level security;
