import { prisma } from "@agentura/db";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";
import { getAppUrl, getStripe, PLANS } from "../../../../lib/stripe";

interface CheckoutPayload {
  priceId?: string;
}

function metadataField(
  metadata: unknown,
  key: "provider_id" | "user_name" | "avatar_url"
): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readAllowedPriceIds(): string[] {
  return [PLANS.indie.priceId, PLANS.pro.priceId].filter(
    (value): value is string => typeof value === "string" && value.length > 0
  );
}

async function readPayload(request: Request): Promise<CheckoutPayload | null> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as CheckoutPayload;
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    const priceId = formData.get("priceId");
    return {
      priceId: typeof priceId === "string" ? priceId : undefined,
    };
  }

  return null;
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: CheckoutPayload | null;
  try {
    payload = await readPayload(request);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const priceId = payload?.priceId?.trim();
  const allowedPriceIds = readAllowedPriceIds();
  if (!priceId || !allowedPriceIds.includes(priceId)) {
    return NextResponse.json({ error: "invalid_price_id" }, { status: 400 });
  }

  const githubId = metadataField(session.user.user_metadata, "provider_id");
  const githubLogin = metadataField(session.user.user_metadata, "user_name");
  const avatarUrl = metadataField(session.user.user_metadata, "avatar_url");

  if (!githubId || !githubLogin) {
    return NextResponse.json({ error: "missing_metadata" }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { githubId },
    update: {
      githubLogin,
      email: session.user.email ?? null,
      avatarUrl,
    },
    create: {
      githubId,
      githubLogin,
      email: session.user.email ?? null,
      avatarUrl,
    },
    select: {
      id: true,
      stripeCustomerId: true,
      email: true,
    },
  });

  const stripe = getStripe();

  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? session.user.email ?? undefined,
      metadata: {
        userId: user.id,
      },
    });

    stripeCustomerId = customer.id;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeCustomerId,
      },
    });
  }

  const appUrl = getAppUrl();
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/dashboard/billing?success=true`,
    cancel_url: `${appUrl}/pricing?canceled=true`,
    metadata: {
      userId: user.id,
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
