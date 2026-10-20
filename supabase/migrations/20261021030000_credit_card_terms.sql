-- Terms of a credit card account (account type CREDIT_CARD). Everything is entered by the
-- user from their card statement, because limits, fees and dates differ for every bank.
-- Money amounts are in minor units (cents), like the rest of the schema.
alter table public."Account"
  -- Maximum amount the bank lets the user owe on the card.
  add column "creditLimit" integer check ("creditLimit" is null or "creditLimit" >= 0),
  -- Day of the month the statement is issued, and the day the payment is due.
  add column "statementDay" smallint check ("statementDay" is null or "statementDay" between 1 and 31),
  add column "dueDay" smallint check ("dueDay" is null or "dueDay" between 1 and 31),
  -- Interest per year, in percent, charged on what is not paid in full.
  add column "interestRate" numeric(5, 2) check ("interestRate" is null or "interestRate" between 0 and 100),
  add column "annualFee" integer check ("annualFee" is null or "annualFee" >= 0),
  add column "lateFee" integer check ("lateFee" is null or "lateFee" >= 0),
  -- Minimum payment: this percent of what is owed, but never less than the floor (Rs. 500 by default).
  add column "minPaymentPercent" numeric(4, 2) not null default 5 check ("minPaymentPercent" between 0 and 100),
  add column "minPaymentFloor" integer not null default 50000 check ("minPaymentFloor" >= 0);
