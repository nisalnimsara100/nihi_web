-- Supabase exposes the public schema through its REST API. NiHi only talks to
-- the database through Prisma as the table owner, so turn on row level
-- security with no policies: the API roles (anon, authenticated) see nothing,
-- while the app keeps full access.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_TagToTransaction" ENABLE ROW LEVEL SECURITY;
