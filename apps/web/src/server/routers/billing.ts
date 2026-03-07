import { prisma } from "@agentura/db";
import { TRPCError } from "@trpc/server";
import { PLANS, type PlanName } from "../../lib/stripe";
import { createTRPCRouter, protectedProcedure } from "../trpc";

function normalizePlan(plan: string | null | undefined): PlanName {
  if (plan === "indie" || plan === "pro") {
    return plan;
  }

  return "free";
}

export const billingRouter = createTRPCRouter({
  current: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        plan: true,
        subscriptionStatus: true,
        currentPeriodEnd: true,
        stripeCustomerId: true,
        stripePriceId: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const plan = normalizePlan(user.plan);

    return {
      plan,
      subscriptionStatus: user.subscriptionStatus,
      currentPeriodEnd: user.currentPeriodEnd,
      stripeCustomerId: user.stripeCustomerId,
      stripePriceId: user.stripePriceId,
      stripeSubscriptionId: user.stripeSubscriptionId,
      plans: PLANS,
    };
  }),
});
