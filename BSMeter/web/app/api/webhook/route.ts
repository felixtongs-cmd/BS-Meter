import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function computeIsPro(hasLifetime: boolean, plan: string, autoscanExpiresAt: string | null): boolean {
  if (hasLifetime) return true;
  if (plan === "autoscan" && autoscanExpiresAt) {
    return new Date(autoscanExpiresAt) > new Date();
  }
  return false;
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = request.headers.get("stripe-signature");
  if (!webhookSecret || !sig) {
    return NextResponse.json({ error: "Missing webhook secret or signature" }, { status: 400 });
  }
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!stripeSecret || !supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecret);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "customer.subscription.updated" &&
    event.type !== "customer.subscription.deleted"
  ) {
    return NextResponse.json({ received: true });
  }

  const autoscanPriceId = process.env.STRIPE_AUTOSCAN_PRICE_ID;

  // --- checkout.session.completed ---
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_email || session.customer_details?.email;

    if (!email) {
      console.error("Webhook: no email in session", session.id);
      return NextResponse.json({ error: "No email" }, { status: 400 });
    }

    const mode = session.mode;
    const subscriptionId = session.subscription as string | null;

    const productMeta = session.metadata?.product;
    if (mode === "subscription" && subscriptionId && (autoscanPriceId || productMeta === "bsmeter_autoscan")) {
      try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;
        if (productMeta === "bsmeter_autoscan" || priceId === autoscanPriceId) {
          const expiresAt = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;

          const { data: existing, error: queryError } = await supabase
            .from("users")
            .select("has_lifetime")
            .eq("email", email.toLowerCase())
            .single();

          // If user doesn't exist yet, hasLifetime is false (will be set by upsert)
          const hasLifetime = queryError?.code === "PGRST116" ? false : !!existing?.has_lifetime;
          const isPro = computeIsPro(hasLifetime, "autoscan", expiresAt);

          const { error } = await supabase.from("users").upsert(
            {
              email: email.toLowerCase(),
              plan: "autoscan",
              stripe_customer_id: session.customer as string | null,
              stripe_subscription_id: subscriptionId,
              autoscan_expires_at: expiresAt,
              is_pro: isPro,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "email" }
          );

          if (error) {
            console.error("Webhook: Supabase upsert error", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
          }
          return NextResponse.json({ received: true });
        }
      } catch (subErr) {
        console.error("Webhook: failed to process subscription", subErr);
        return NextResponse.json({ error: "Subscription processing failed" }, { status: 500 });
      }
    }

    // One-time payment (lifetime)
    const product = session.metadata?.product;
    if (mode === "payment" || product === "bsmeter_lifetime") {
      const { data: existing, error: queryError } = await supabase
        .from("users")
        .select("plan, autoscan_expires_at")
        .eq("email", email.toLowerCase())
        .single();

      // If user doesn't exist yet, use defaults
      const hasLifetime = true;
      const plan = (queryError?.code === "PGRST116" ? null : existing?.plan) || "free";
      const autoscanExpiresAt = (queryError?.code === "PGRST116" ? null : existing?.autoscan_expires_at) ?? null;
      const isPro = computeIsPro(hasLifetime, plan, autoscanExpiresAt);

      const { error } = await supabase.from("users").upsert(
        {
          email: email.toLowerCase(),
          has_lifetime: true,
          is_pro: isPro,
          stripe_customer_id: session.customer as string | null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

      if (error) {
        console.error("Webhook: Supabase upsert error", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ received: true });
    }
  }

  // --- customer.subscription.updated / deleted ---
  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const subscriptionId = subscription.id;

    const { data: userRow, error: queryError } = await supabase
      .from("users")
      .select("email, has_lifetime, plan")
      .eq("stripe_subscription_id", subscriptionId)
      .single();

    if (queryError || !userRow) {
      // Subscription might not be linked to a user yet, or user might not exist
      // This can happen if webhook fires before checkout.session.completed
      return NextResponse.json({ received: true });
    }

    let plan: "free" | "autoscan" = "free";
    let autoscanExpiresAt: string | null = null;
    let stripeSubId: string | null = null;

    if (event.type === "customer.subscription.updated" && subscription.status === "active") {
      plan = "autoscan";
      autoscanExpiresAt = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;
      stripeSubId = subscriptionId;
    }

    const isPro = computeIsPro(!!userRow.has_lifetime, plan, autoscanExpiresAt);

    const { error } = await supabase
      .from("users")
      .update({
        plan,
        stripe_subscription_id: stripeSubId,
        autoscan_expires_at: autoscanExpiresAt,
        is_pro: isPro,
        updated_at: new Date().toISOString(),
      })
      .eq("email", userRow.email);

    if (error) {
      console.error("Webhook: Supabase update error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
