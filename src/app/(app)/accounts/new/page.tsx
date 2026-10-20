import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, Skeleton } from "@/components/ui";
import { requireOwnView } from "@/lib/auth";
import { DEFAULT_CARD_THEME } from "@/lib/card-themes";
import { COLORS } from "@/lib/constants";
import { AccountForm } from "../account-form";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "New account" };

export default async function NewAccountPage() {
  const t = await getT();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("New account")} />
      <Suspense fallback={<Skeleton className="h-[560px]" />}>
        <NewAccount />
      </Suspense>
    </div>
  );
}

async function NewAccount() {
  const { user } = await requireOwnView();
  return (
    <AccountForm
      initial={{
        name: "",
        type: "BANK",
        currency: user.defaultCurrency,
        initialBalance: "",
        color: COLORS[0],
        theme: DEFAULT_CARD_THEME,
        note: "",
        archived: false,
        creditLimit: "",
        interestRate: "",
      }}
    />
  );
}
