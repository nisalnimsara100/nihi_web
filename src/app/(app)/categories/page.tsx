import type { Metadata } from "next";
import { Suspense } from "react";
import { deleteCategory, saveCategory } from "@/actions/labels";
import { LabelManager } from "@/components/label-manager";
import { PageHeader, PageSkeleton } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { getCategories } from "@/lib/data";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const t = await getT();
  return (
    <>
      <PageHeader
        title={t("Categories")}
        description="Group income and spending. Deleting a category keeps its transactions as uncategorized."
      />
      <Suspense fallback={<PageSkeleton />}>
        <Categories />
      </Suspense>
    </>
  );
}

async function Categories() {
  const t = await getT();
  const { owner: user, readOnly } = await getViewer();
  const categories = await getCategories(user.id);
  const toItems = (type: "INCOME" | "EXPENSE") =>
    categories
      .filter((c) => c.type === type)
      .map((c) => ({ id: c.id, name: c.name, color: c.color, icon: c.icon, count: c.transactionCount }));

  return (
    <div className="grid items-start gap-4 *:min-w-0 lg:grid-cols-2">
      <LabelManager
        title={t("Expense")}
        noun="category"
        withIcon
        items={toItems("EXPENSE")}
        save={saveCategory}
        remove={deleteCategory}
        hidden={{ type: "EXPENSE" }}
        readOnly={readOnly}
      />
      <LabelManager
        title={t("Income")}
        noun="category"
        withIcon
        items={toItems("INCOME")}
        save={saveCategory}
        remove={deleteCategory}
        hidden={{ type: "INCOME" }}
        readOnly={readOnly}
      />
    </div>
  );
}
