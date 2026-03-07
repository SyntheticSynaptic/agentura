import { prisma } from "@agentura/db";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getPlanFromPriceId, getStripe } from "../../../../lib/stripe";

export const runtime = "nodejs";

function customerIdFromUnknown(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null {
  if (typeof customer === "string") {
    return customer;
  }

  if (customer && typeof customer === "object" && "id" in customer) {
    const value = customer.id;
    return typeof value === "string" && value.length > 0 ? value : null;
  }

  return null;
}

function priceIdFromSubscription(subscription: Stripe.Subscription): string | null {
  const firstItem = subscription.items.data[0];
  if (!firstItem) {
    return null;
  }

  return firstItem.price.id ?? null;
}

function currentPeriodEndDate(subscription: Stripe.Subscription): Date | null {
  const periodEnd = (subscription as unknown as Record<string, unknown>).current_period_end;
  if (typeof periodEnd !== "number" || !Number.isFinite(periodEnd)) {
    return null;
  }

  return new Date(periodEnd * 1000);
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId?.trim();
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : null;

      if (userId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = priceIdFromSubscription(subscription);

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: getPlanFromPriceId(priceId),
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            subscriptionStatus: subscription.status,
            currentPeriodEnd: currentPeriodEndDate(subscription),
          },
        });
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = customerIdFromUnknown(subscription.customer);
      const priceId = priceIdFromSubscription(subscription);

      if (customerId) {
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            plan: getPlanFromPriceId(priceId),
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            subscriptionStatus: subscription.status,
            currentPeriodEnd: currentPeriodEndDate(subscription),
          },
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = customerIdFromUnknown(subscription.customer);

      if (customerId) {
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            plan: "free",
            subscriptionStatus: "canceled",
            stripePriceId: null,
            stripeSubscriptionId: null,
            currentPeriodEnd: null,
          },
        });
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = customerIdFromUnknown(invoice.customer);

      if (customerId) {
        await prisma.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionStatus: "past_due",
          },
        });
      }
    }
  } catch (error) {
    console.error("[stripe webhook] handler error:", error);
  }

  return NextResponse.json({ received: true });
}
