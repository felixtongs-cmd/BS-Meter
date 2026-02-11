import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, successUrl, cancelUrl, plan } = body as {
      email?: string;
      successUrl?: string;
      cancelUrl?: string;
      plan?: "lifetime" | "autoscan";
    };

    const lifetimePriceId = process.env.STRIPE_LIFETIME_PRICE_ID;
    const autoscanPriceId = process.env.STRIPE_AUTOSCAN_PRICE_ID;

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const finalSuccessUrl = successUrl || `${baseUrl}/dashboard?success=1`;
    const finalCancelUrl = cancelUrl || `${baseUrl}/dashboard?canceled=1`;

    // Autoscan plan: $20/month subscription
    if (plan === "autoscan" && autoscanPriceId) {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price: autoscanPriceId,
            quantity: 1,
          },
        ],
        success_url: finalSuccessUrl,
        cancel_url: finalCancelUrl,
        customer_email: email || undefined,
        metadata: { product: "bsmeter_autoscan" },
        subscription_data: {
          metadata: { product: "bsmeter_autoscan" },
        },
      });
      return NextResponse.json({ url: session.url, sessionId: session.id });
    }

    // Lifetime plan: $15 one-time (default)
    if (!lifetimePriceId) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: lifetimePriceId,
          quantity: 1,
        },
      ],
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      customer_email: email || undefined,
      metadata: { product: "bsmeter_lifetime" },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
