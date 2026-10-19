import type { Metadata } from "next";
import { Suspense } from "react";
import { deleteCategory, saveCategory } from "@/actions/labels";
import { LabelManager } from "@/components/label-manager";
import { PageHeader, PageSkeleton } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getCategories } from "@/lib/data";

export const metadata: Metadata = { title: "Categories" };

export default function CategoriesPage() {
  return (
    <>
      <PageHeader
        title="Categories"
        description="Group income and spending. Deleting a category keeps its transactions as uncategorized."
      />
      <Suspense fallback={<PageSkeleton />}>
        <Categories />
      </Suspense>
    </>
  );
}

async function Categories() {
  const user = await getCurrentUser();
  const categories = await getCategories(user.id);
  const toItems = (type: "INCOME" | "EXPENSE") =>
    categories
      .filter((c) => c.type === type)
      .map((c) => ({ id: c.id, name: c.name, color: c.color, icon: c.icon, count: c._count.transactions }));

  return (
    <div className="grid items-start gap-4 *:min-w-0 lg:grid-cols-2">
      <LabelManager
        title="Expense"
        noun="category"
        withIcon
        items={toItems("EXPENSE")}
        save={saveCategory}
        remove={deleteCategory}
        hidden={{ type: "EXPENSE" }}
      />
      <LabelManager
        title="Income"
        noun="category"
        withIcon
        items={toItems("INCOME")}
        save={saveCategory}
        remove={deleteCategory}
        hidden={{ type: "INCOME" }}
      />
    </div>
  );
}
