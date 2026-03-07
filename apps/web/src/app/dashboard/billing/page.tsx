import { headers } from "next/headers";
import Link from "next/link";
import { CheckoutButton } from "../../../components/landing/CheckoutButton";
import { appRouter } from "../../../server/routers/_app";
import { createTRPCContext } from "../../../server/trpc";

const PLAN_ORDER = ["free", "indie", "pro"] as const;

const PLAN_FEATURES: Record<(typeof PLAN_ORDER)[number], string[]> = {
  free: [
    "1 repository",
    "50 eval runs / month",
    "All eval strategies",
    "PR comments + Check Runs",
  ],
  indie: [
    "5 repositories",
    "500 eval runs / month",
    "All eval strategies",
    "Email support",
  ],
  pro: [
    "Unlimited repositories",
    "Unlimited eval runs",
    "Priority support",
    "Team management + SSO",
  ],
};

function formatPlanLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function renderStatusBadge(status: string | null) {
  if (!status) {
    return null;
  }

  if (status === "active") {
    return (
      <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
        Active
      </span>
    );
  }

  if (status === "past_due") {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
        Past Due
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">
      {formatPlanLabel(status)}
    </span>
  );
}

function formatDate(value: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString();
}

export default async function BillingPage() {
  const caller = appRouter.createCaller(
    await createTRPCContext({
      headers: headers(),
    })
  );

  const billing = await caller.billing.current();
  const currentPlan = billing.plan;
  const currentPlanConfig = billing.plans[currentPlan];
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan);
  const upgradePlans = PLAN_ORDER.slice(currentPlanIndex + 1).filter(
    (planName) => billing.plans[planName].priceId
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">Billing</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
            Plan & Subscription
          </h1>
        </div>
        <Link href="/dashboard" className="text-sm font-medium text-slate-700 underline">
          Back to dashboard
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-slate-900 p-6 text-slate-100">
        <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Current plan</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">{currentPlanConfig.name}</h2>
        <div className="mt-4">{renderStatusBadge(billing.subscriptionStatus)}</div>
        {currentPlan !== "free" ? (
          <p className="mt-4 text-sm text-slate-300">
            Current period ends: {formatDate(billing.currentPeriodEnd) ?? "—"}
          </p>
        ) : null}

        {currentPlan !== "free" ? (
          <form action="/api/stripe/portal" method="post" className="mt-6">
            <button
              type="submit"
              className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Manage billing →
            </button>
          </form>
        ) : null}
      </section>

      {upgradePlans.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2">
          {upgradePlans.map((planName) => {
            const plan = billing.plans[planName];
            const priceId = plan.priceId;
            if (!priceId) {
              return null;
            }

            return (
              <article key={planName} className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  ${plan.price}
                  <span className="text-base font-medium text-slate-500"> / month</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {PLAN_FEATURES[planName].map((feature) => (
                    <li key={feature}>✓ {feature}</li>
                  ))}
                </ul>

                <CheckoutButton
                  priceId={priceId}
                  label={`Upgrade to ${plan.name} →`}
                  className="mt-6 inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                />
              </article>
            );
          })}
        </section>
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-slate-700">You are already on the highest available plan.</p>
        </section>
      )}
    </main>
  );
}
