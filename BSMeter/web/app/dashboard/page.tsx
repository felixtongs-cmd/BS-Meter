"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Chrome, Loader2 } from "lucide-react";

function DashboardContent() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [hasAutoscan, setHasAutoscan] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    (async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      if (!u) {
        router.replace("/login");
        return;
      }
      setUser({ email: u.email! });

      const { data: row, error: userError } = await supabase
        .from("users")
        .select("is_pro, plan, autoscan_expires_at")
        .eq("email", u.email!.toLowerCase())
        .single();
      
      // Handle case where user doesn't exist in users table yet
      if (userError && userError.code !== "PGRST116") {
        console.error("Error fetching user data:", userError);
      }
      
      setIsPro(!!row?.is_pro);
      setHasAutoscan(
        !!(
          row?.plan === "autoscan" &&
          row?.autoscan_expires_at &&
          new Date(row.autoscan_expires_at) > new Date()
        )
      );
      setLoading(false);
    })();
  }, [supabase, router]);

  useEffect(() => {
    if (typeof window === "undefined" || isPro === null) return;
    window.postMessage(
      { type: "BSMETER_PRO_SYNC", isPro: isPro, hasAutoscan: hasAutoscan },
      window.location.origin
    );
  }, [isPro, hasAutoscan]);

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    if (success === "1") {
      const refetch = async (retries = 0) => {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (!u?.email) {
          setIsPro(true);
          setHasAutoscan(searchParams.get("plan") === "autoscan");
          return;
        }
        const { data: row, error: refetchError } = await supabase
          .from("users")
          .select("is_pro, plan, autoscan_expires_at")
          .eq("email", u.email.toLowerCase())
          .single();
        
        // Handle case where user doesn't exist in users table yet
        if (refetchError && refetchError.code !== "PGRST116") {
          console.error("Error refetching user data:", refetchError);
        }
        
        const newHasAutoscan = !!(
          row?.plan === "autoscan" &&
          row?.autoscan_expires_at &&
          new Date(row.autoscan_expires_at) > new Date()
        );
        setIsPro(!!row?.is_pro);
        setHasAutoscan(newHasAutoscan);
        if (searchParams.get("plan") === "autoscan" && !newHasAutoscan && retries < 3) {
          setTimeout(() => refetch(retries + 1), 2000);
        }
      };
      refetch();
      window.history.replaceState({}, "", "/dashboard");
    }
    if (canceled === "1") {
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [searchParams, supabase]);

  async function handleCheckout(plan: "lifetime" | "autoscan" = "lifetime") {
    setCheckoutLoading(true);
    try {
      // First check if there's a Stripe payment link available
      let linkData;
      try {
        const linkRes = await fetch(`/api/checkout-link?plan=${plan}`);
        if (!linkRes.ok) throw new Error("Failed to fetch checkout link");
        linkData = await linkRes.json();
      } catch (linkErr) {
        console.error("Error fetching checkout link:", linkErr);
        linkData = null;
      }
      
      // If checkout-link returns a Stripe payment link (not dashboard URL), use it
      if (linkData?.url && !linkData.url.includes("/dashboard")) {
        window.location.href = linkData.url;
        return;
      }
      
      // Fallback to creating a checkout session
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u?.email) {
        throw new Error("Please log in to continue");
      }
      
      const successParams = plan === "autoscan" ? "success=1&plan=autoscan" : "success=1";
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: u.email,
          plan,
          successUrl: window.location.origin + "/dashboard?" + successParams,
          cancelUrl: window.location.origin + "/dashboard?canceled=1",
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Checkout failed" }));
        throw new Error(errorData.error || "Checkout failed");
      }
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Checkout failed");
      }
    } catch (e) {
      console.error("Checkout error:", e);
      alert(e instanceof Error ? e.message : "Failed to start checkout. Please try again.");
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#eb4034] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <header className="border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white">
            ← BS Meter
          </Link>
          <span className="text-slate-500 text-sm">{user?.email}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-slate-400 mb-10">
          Manage your account and sync Pro to the extension.
        </p>

        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            {isPro && (
              <ShieldCheck className="w-10 h-10 text-[#10b981]" />
            )}
            <div>
              <h2 className="text-xl font-semibold">
                {isPro ? (hasAutoscan ? "You have Autoscan" : "You have Pro") : "Free plan"}
              </h2>
              <p className="text-slate-400 text-sm">
                {isPro
                  ? hasAutoscan
                    ? "Unlimited checks + Alibaba auto-scan. Install the extension to sync."
                    : "Unlimited checks. Add Autoscan for Alibaba + auto-scan."
                  : "3 checks per day. Upgrade for unlimited."}
              </p>
            </div>
          </div>

          {!isPro && (
            <div className="space-y-3">
              <button
                onClick={() => handleCheckout("lifetime")}
                disabled={checkoutLoading}
                className="w-full py-4 rounded-xl bg-[#eb4034] text-white font-bold text-lg hover:bg-[#d6382e] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {checkoutLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "$15 AUD — Get Lifetime Access"
                )}
              </button>
              <button
                onClick={() => handleCheckout("autoscan")}
                disabled={checkoutLoading}
                className="w-full py-3 rounded-xl border-2 border-slate-600 text-white font-semibold hover:border-slate-500 hover:bg-slate-800/50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                $20 AUD/mo — Autoscan (Alibaba + auto-scan)
              </button>
            </div>
          )}

          {isPro && !hasAutoscan && (
            <button
              onClick={() => handleCheckout("autoscan")}
              disabled={checkoutLoading}
              className="w-full py-3 rounded-xl border-2 border-[#10b981] text-[#10b981] font-semibold hover:bg-[#10b981]/10 disabled:opacity-50 transition-colors mt-4"
            >
              Add Autoscan — $20 AUD/mo
            </button>
          )}
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-8">
          <h3 className="font-semibold mb-2">Sync Pro to the extension</h3>
          <p className="text-slate-400 text-sm mb-4">
            Visit this dashboard while the BS Meter extension is installed. If you’re Pro, the extension will sync automatically. Open any product page and use the BS Meter button for unlimited checks.
          </p>
          <a
            href="https://chromewebstore.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors"
          >
            <Chrome className="w-4 h-4" />
            Add to Chrome
          </a>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#eb4034] animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
