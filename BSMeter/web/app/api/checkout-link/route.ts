import { NextRequest, NextResponse } from "next/server";

/**
 * Returns a Stripe checkout URL for the extension to open in a new tab.
 * If NEXT_PUBLIC_STRIPE_LIFETIME_PAYMENT_LINK is set (Stripe Payment Link), that is returned.
 * Otherwise returns the dashboard URL so the user can start checkout from there.
 */
export async function GET(request: NextRequest) {
  const plan = request.nextUrl.searchParams.get("plan") || "lifetime";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  if (plan === "lifetime") {
    const paymentLink = process.env.NEXT_PUBLIC_STRIPE_LIFETIME_PAYMENT_LINK;
    if (paymentLink && paymentLink.startsWith("http")) {
      return NextResponse.json({ url: paymentLink });
    }
  }

  if (plan === "autoscan") {
    const paymentLink = process.env.NEXT_PUBLIC_STRIPE_AUTOSCAN_PAYMENT_LINK;
    if (paymentLink && paymentLink.startsWith("http")) {
      return NextResponse.json({ url: paymentLink });
    }
  }

  return NextResponse.json({ url: `${baseUrl}/dashboard` });
}
