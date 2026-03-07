import { prisma } from "@agentura/db";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";
import { getAppUrl, getStripe } from "../../../../lib/stripe";

function metadataField(metadata: unknown, key: "provider_id"): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function wantsHtmlResponse(request: Request): boolean {
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html");
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const githubId = metadataField(session.user.user_metadata, "provider_id");
  if (!githubId) {
    return NextResponse.json({ error: "missing_metadata" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { githubId },
    select: {
      stripeCustomerId: true,
    },
  });

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "no_customer" }, { status: 400 });
  }

  const stripe = getStripe();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${getAppUrl()}/dashboard/billing`,
  });

  if (wantsHtmlResponse(request)) {
    return NextResponse.redirect(portalSession.url, { status: 303 });
  }

  return NextResponse.json({ url: portalSession.url });
}
