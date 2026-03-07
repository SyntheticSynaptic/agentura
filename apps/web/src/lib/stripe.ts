import Stripe from "stripe";

const STRIPE_API_VERSION = "2024-06-20";

let stripeClient: Stripe | null = null;

export const PLANS = {
  free: {
    name: "Free",
    priceId: null,
    price: 0,
    repos: 1,
    runsPerMonth: 50,
  },
  indie: {
    name: "Indie",
    priceId: process.env.STRIPE_INDIE_PRICE_ID ?? null,
    price: 20,
    repos: 5,
    runsPerMonth: 500,
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? null,
    price: 49,
    repos: -1,
    runsPerMonth: -1,
  },
} as const;

export type PlanName = keyof typeof PLANS;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: STRIPE_API_VERSION as Stripe.LatestApiVersion,
    });
  }

  return stripeClient;
}

export function getPlanFromPriceId(priceId: string | null | undefined): PlanName {
  if (priceId && PLANS.indie.priceId === priceId) {
    return "indie";
  }

  if (priceId && PLANS.pro.priceId === priceId) {
    return "pro";
  }

  return "free";
}

export function getAppUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    return appUrl.replace(/\/$/, "");
  }

  const nextAuthUrl = process.env.NEXTAUTH_URL?.trim();
  if (nextAuthUrl) {
    return nextAuthUrl.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}
