import type { Metadata } from "next";
import { Suspense } from "react";
import { deleteTag, saveTag } from "@/actions/labels";
import { LabelManager } from "@/components/label-manager";
import { PageHeader, PageSkeleton } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { getTags } from "@/lib/data";

export const metadata: Metadata = { title: "Tags" };

export default function TagsPage() {
  return (
    <>
      <PageHeader title="Tags" description="Mark transactions across categories, like a trip or a project." />
      <Suspense fallback={<PageSkeleton />}>
        <Tags />
      </Suspense>
    </>
  );
}

async function Tags() {
  const { owner: user, readOnly } = await getViewer();
  const tags = await getTags(user.id);
  return (
    <div className="max-w-2xl">
      <LabelManager
        title="All tags"
        noun="tag"
        items={tags.map((t) => ({ id: t.id, name: t.name, color: t.color, count: t.transactionCount }))}
        save={saveTag}
        remove={deleteTag}
        readOnly={readOnly}
      />
    </div>
  );
}
