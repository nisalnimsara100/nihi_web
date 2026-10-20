import type { Metadata } from "next";
import { Suspense } from "react";
import { Flag } from "@/components/icons";
import { Card, EmptyState, PageHeader, PageSkeleton } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { getAccounts, getGoals } from "@/lib/data";
import { todayDay } from "@/lib/dates";
import { GoalCard, NewGoal } from "./goal-forms";

export const metadata: Metadata = { title: "Goals" };

export default function GoalsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Goals />
    </Suspense>
  );
}

async function Goals() {
  const { owner: user, readOnly } = await getViewer();
  const [goals, accounts] = await Promise.all([getGoals(user.id), getAccounts(user.id)]);
  const savings = accounts.filter((a) => a.type === "SAVINGS").map((a) => ({ id: a.id, name: a.name, currency: a.currency }));
  const today = todayDay();

  return (
    <>
      <PageHeader title="Goals" description="Save towards something, like Rs. 100,000 by December." actions={readOnly ? undefined : <NewGoal accounts={savings} defaultCurrency={user.defaultCurrency} />} />
      {goals.length === 0 ? (
        <Card>
          <EmptyState icon={<Flag className="size-6" />} title="No goals yet" description="Add one to see how much to put aside each month." />
        </Card>
      ) : (
        <div className="grid gap-4 *:min-w-0 sm:grid-cols-2">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              readOnly={readOnly}
              today={today}
              accounts={savings}
              goal={{ id: g.id, name: g.name, currency: g.currency, targetAmount: g.targetAmount, targetDate: g.targetDate, accountId: g.accountId, accountName: g.accountName, saved: g.saved }}
            />
          ))}
        </div>
      )}
    </>
  );
}
