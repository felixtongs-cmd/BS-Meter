import Link from "next/link";
import {
  Chrome,
  Check,
  ImageIcon,
  MessageSquare,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Top bar */}
      <div className="bg-[#eb4034] text-center py-2.5 text-sm font-medium text-white">
        Stop fake reviews & dropshipping scams — one click on any product page.
      </div>

      {/* Header */}
      <header className="border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="w-8 h-8" aria-hidden />
            <span className="text-xl font-bold tracking-tight">BS Meter</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-slate-300 text-sm font-medium">
            <a href="#demo" className="hover:text-white transition-colors">
              Demo
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#how" className="hover:text-white transition-colors">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              Login
            </Link>
            <a
              href="https://chromewebstore.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#0f172a] font-semibold text-sm hover:bg-slate-100 transition-colors"
            >
              <Chrome className="w-4 h-4" />
              Add to Chrome
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
        <p className="text-slate-400 text-sm font-medium mb-4">
          Detect fake reviews & dropshipping on Amazon & Shopify
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          Stop Getting Scammed.
          <br />
          <span className="bg-[#eb4034] text-white px-2 rounded">Shop for Real.</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto mb-10">
          One click on any product page shows a Sus Score and lets you reverse-image search for dropshipping. No guesswork.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="https://chromewebstore.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#eb4034] text-white font-bold text-lg hover:bg-[#d6382e] transition-colors shadow-lg shadow-[#eb4034]/30"
          >
            <Chrome className="w-5 h-5" />
            Add to Chrome
          </a>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-slate-600 text-white font-semibold hover:border-slate-500 hover:bg-slate-800/50 transition-colors"
          >
            Log in
          </Link>
        </div>
        <p className="text-slate-500 text-sm mt-4">NO CREDIT CARD NEEDED to try</p>
      </section>

      {/* Demo */}
      <section id="demo" className="border-t border-slate-800 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">See it in action</h2>
          <p className="text-slate-400 text-center max-w-xl mx-auto mb-12">
            On Amazon or Shopify product pages, the BS Meter button appears. Click it for a Sus Score and a one-click Google Lens check.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-8 flex flex-col items-center justify-center min-h-[280px]">
              <ImageIcon className="w-16 h-16 text-[#10b981] mb-4" />
              <h3 className="text-lg font-semibold mb-2">Dropship check</h3>
              <p className="text-slate-400 text-sm text-center">
                Open product image in Google Lens to find the real source.
              </p>
            </div>
            <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-8 flex flex-col items-center justify-center min-h-[280px]">
              <MessageSquare className="w-16 h-16 text-[#eb4034] mb-4" />
              <h3 className="text-lg font-semibold mb-2">Fake review signals</h3>
              <p className="text-slate-400 text-sm text-center">
                ALL CAPS, repetitive phrases, and generic praise add to the Sus Score.
              </p>
            </div>
          </div>
          <div className="mt-8 rounded-xl bg-slate-800/30 border border-slate-700 border-dashed min-h-[200px] flex items-center justify-center text-slate-500">
            [ Placeholder: your demo screenshots ]
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-slate-800 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-12">How it works</h2>
          <ul className="space-y-6 text-left">
            {[
              "Install the extension and open any Amazon or Shopify product page.",
              "Click the BS Meter button to see a 0–100 Sus Score from the first 5 visible reviews.",
              "Use “Dropship check” to open the product image in Google Lens.",
              "Free: 3 checks per day. Go Pro for unlimited checks.",
            ].map((step, i) => (
              <li key={i} className="flex gap-4 items-start">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#eb4034] text-white font-bold flex items-center justify-center text-sm">
                  {i + 1}
                </span>
                <span className="text-slate-300">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-slate-800 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Choose your plan</h2>
          <p className="text-slate-400 mb-10">
            Amazon, Shopify, and Alibaba support. Pick lifetime or autoscan.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="rounded-2xl border-2 border-[#eb4034] bg-slate-800/50 p-8">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-extrabold">$15</span>
                <span className="text-slate-400">AUD</span>
              </div>
              <p className="text-slate-400 text-sm mb-6">Lifetime — one payment</p>
              <ul className="space-y-3 mb-8">
                {["Unlimited Sus Score checks", "Unlimited dropship checks", "Amazon & Shopify"].map(
                  (f) => (
                    <li key={f} className="flex items-center gap-2 text-slate-300">
                      <Check className="w-5 h-5 text-[#10b981] flex-shrink-0" />
                      {f}
                    </li>
                  )
                )}
              </ul>
              <Link
                href="/dashboard"
                className="block w-full py-4 rounded-xl bg-[#eb4034] text-white font-bold text-center hover:bg-[#d6382e] transition-colors"
              >
                Get Lifetime Access
              </Link>
            </div>
            <div className="rounded-2xl border-2 border-slate-600 bg-slate-800/50 p-8">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-extrabold">$20</span>
                <span className="text-slate-400">AUD/mo</span>
              </div>
              <p className="text-slate-400 text-sm mb-6">Autoscan — Alibaba + auto-scan</p>
              <ul className="space-y-3 mb-8">
                {["Everything in Lifetime", "Alibaba support", "Auto-scan reviews on Alibaba"].map(
                  (f) => (
                    <li key={f} className="flex items-center gap-2 text-slate-300">
                      <Check className="w-5 h-5 text-[#10b981] flex-shrink-0" />
                      {f}
                    </li>
                  )
                )}
              </ul>
              <Link
                href="/dashboard"
                className="block w-full py-4 rounded-xl border-2 border-slate-500 text-white font-bold text-center hover:bg-slate-700/50 transition-colors"
              >
                Get Autoscan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
          <span>© BS Meter</span>
          <div className="flex gap-6">
            <Link href="/login" className="hover:text-slate-400">
              Login
            </Link>
            <a href="#pricing" className="hover:text-slate-400">
              Pricing
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
