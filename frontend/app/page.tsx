"use client";

import { useState } from "react";
import TrendChart from "./components/TrendChart";

interface KeywordItem {
  keyword: string;
  avg_heat: number;
  trend?: string;
  growth_rate?: number;
}

function EarlyAccessForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.message || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-4">
        <div className="text-4xl mb-3">🎉</div>
        <p className="text-green-600 font-semibold text-lg">You&apos;re on the list!</p>
        <p className="text-gray-500 text-sm mt-1">
          We&apos;ll send you early access + 30% off at launch.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status === "loading"}
        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm whitespace-nowrap disabled:bg-gray-400"
      >
        {status === "loading" ? "Joining..." : "Join Waitlist →"}
      </button>
      {errorMsg && (
        <p className="text-red-500 text-xs mt-1 sm:col-span-2">{errorMsg}</p>
      )}
    </form>
  );
}

function OpportunityScore({ score }: { score: number }) {
  const color = score >= 70 ? "text-green-600" : score >= 40 ? "text-yellow-600" : "text-gray-400";
  const label = score >= 70 ? "High Opportunity" : score >= 40 ? "Medium" : "Low";
  return (
    <span className={`text-xs font-semibold ${color}`}>
      ● {label} ({score})
    </span>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<KeywordItem[]>([]);
  const [loading, setLoading] = useState(false);

  const searchTrends = async () => {
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.trendscout.dev";
      const url = query
        ? `${apiBase}/api/keywords/search?q=${query}&limit=20`
        : `${apiBase}/api/keywords/trending?limit=20`;

      const res = await fetch(url);
      const data = await res.json();
      setResults(data.results || data.trends || []);
    } catch (error) {
      console.error("Error:", error);
    }
    setLoading(false);
  };

  // 简单的机会评分：基于 avg_heat 和 growth_rate
  const getOpportunityScore = (item: KeywordItem) => {
    const heat = Math.min(item.avg_heat, 100);
    const growth = item.growth_rate ?? 0;
    const trendBonus = item.trend === "rising" ? 15 : item.trend === "falling" ? -10 : 0;
    return Math.min(100, Math.round(heat * 0.6 + growth * 0.3 + trendBonus));
  };

  return (
    <main className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-bold text-gray-900 text-lg">TrendScout</span>
          <a
            href="#waitlist"
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Join Waitlist
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-12 text-center">
        <div className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
          Built for solo founders
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
          The trend research tool<br />
          <span className="text-blue-600">built for solo founders.</span>
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
          Google Trends tells you what&apos;s rising.<br />
          <strong className="text-gray-700">TrendScout tells you if it&apos;s worth your time.</strong>
        </p>
        <a
          href="#search"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-base"
        >
          Try it free →
        </a>
        <p className="text-gray-400 text-xs mt-3">No sign-up required · 861 keywords tracked</p>
      </section>

      {/* Pain Points */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-3xl mx-auto px-6">
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="text-2xl mb-2">😤</div>
              <p className="text-sm text-gray-700 font-medium">Google Trends shows a rising line.</p>
              <p className="text-xs text-gray-400 mt-1">But not whether there&apos;s real demand behind it.</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="text-2xl mb-2">💸</div>
              <p className="text-sm text-gray-700 font-medium">Ahrefs &amp; Semrush have the data.</p>
              <p className="text-xs text-gray-400 mt-1">But $99–199/month is built for agencies, not you.</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="text-2xl mb-2">⏰</div>
              <p className="text-sm text-gray-700 font-medium">You spend hours manually checking.</p>
              <p className="text-xs text-gray-400 mt-1">Reddit, forums, competitor sites — and still feel uncertain.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Search / Try it */}
      <section id="search" className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">See it in action</h2>
          <p className="text-gray-500 text-sm">Search any keyword to see trend heat + opportunity score</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Try: stanley cup, AI tools, meal prep..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchTrends()}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={searchTrends}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm disabled:bg-gray-300 whitespace-nowrap"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {results.length === 0 && !loading && (
            <div className="mt-4 flex gap-2 flex-wrap">
              {["stanley cup", "AI agent", "cold plunge", "meal prep"].map((kw) => (
                <button
                  key={kw}
                  onClick={() => { setQuery(kw); setTimeout(searchTrends, 100); }}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-full transition"
                >
                  {kw}
                </button>
              ))}
            </div>
          )}
        </div>

        {results.length > 0 && (
          <div className="mt-6 space-y-3">
            <TrendChart data={results} />
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Results ({results.length})</span>
                <span className="text-xs text-gray-400">Opportunity Score = heat + growth + trend</span>
              </div>
              <div className="divide-y divide-gray-50">
                {results.map((item, idx) => {
                  const score = getOpportunityScore(item);
                  return (
                    <div key={idx} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <span className="font-medium text-gray-800 text-sm">{item.keyword}</span>
                        {item.trend && (
                          <span className={`ml-2 text-xs ${item.trend === "rising" ? "text-green-500" : item.trend === "falling" ? "text-red-400" : "text-gray-400"}`}>
                            {item.trend === "rising" ? "↑" : item.trend === "falling" ? "↓" : "→"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-400">Heat: {Math.round(item.avg_heat)}</span>
                        <OpportunityScore score={score} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">From trend to decision in minutes</h2>
          <p className="text-gray-500 text-sm mb-10">The complete research flow, not just raw data.</p>
          <div className="grid sm:grid-cols-3 gap-6 text-left">
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="text-blue-600 font-bold text-lg mb-2">1. Discover</div>
              <p className="text-sm text-gray-600">See what&apos;s rising across 800+ keywords, updated daily with real search data.</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="text-blue-600 font-bold text-lg mb-2">2. Validate</div>
              <p className="text-sm text-gray-600">Check demand strength, growth rate, and market competition — not just a trending line.</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="text-blue-600 font-bold text-lg mb-2">3. Decide</div>
              <p className="text-sm text-gray-600">Each trend gets an Opportunity Score so you know which ones are worth your time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Simple pricing. No tricks.</h2>
          <p className="text-gray-500 text-sm">Cancel anytime. No hidden fees. No auto-charge on trial.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          <div className="border border-gray-200 rounded-2xl p-6">
            <div className="font-bold text-gray-900 mb-1">Free</div>
            <div className="text-3xl font-bold text-gray-900 mb-3">$0</div>
            <ul className="text-sm text-gray-500 space-y-2 mb-6">
              <li>✓ 5 searches / day</li>
              <li>✓ Basic trend data</li>
              <li>✓ No sign-up needed</li>
            </ul>
            <a href="#search" className="block text-center text-sm border border-gray-300 rounded-lg py-2 hover:bg-gray-50 transition">
              Try now
            </a>
          </div>
          <div className="border-2 border-blue-600 rounded-2xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">Most popular</div>
            <div className="font-bold text-gray-900 mb-1">Starter</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">$19<span className="text-base font-normal text-gray-400">/mo</span></div>
            <div className="text-xs text-gray-400 mb-3">or $15/mo billed annually</div>
            <ul className="text-sm text-gray-500 space-y-2 mb-6">
              <li>✓ Unlimited searches</li>
              <li>✓ Full trend data + Opportunity Score</li>
              <li>✓ Cancel anytime</li>
              <li>✓ No credit card for trial</li>
            </ul>
            <a href="#waitlist" className="block text-center text-sm bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition font-semibold">
              Join Waitlist
            </a>
          </div>
          <div className="border border-gray-200 rounded-2xl p-6">
            <div className="font-bold text-gray-900 mb-1">Pro</div>
            <div className="text-3xl font-bold text-gray-900 mb-1">$29<span className="text-base font-normal text-gray-400">/mo</span></div>
            <div className="text-xs text-gray-400 mb-3">or $24/mo billed annually</div>
            <ul className="text-sm text-gray-500 space-y-2 mb-6">
              <li>✓ Everything in Starter</li>
              <li>✓ Monthly trend report</li>
              <li>✓ Early access to new features</li>
            </ul>
            <a href="#waitlist" className="block text-center text-sm border border-gray-300 rounded-lg py-2 hover:bg-gray-50 transition">
              Join Waitlist
            </a>
          </div>
        </div>
      </section>

      {/* Waitlist CTA */}
      <section id="waitlist" className="bg-gradient-to-br from-blue-600 to-indigo-700 py-16">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Join the waitlist</h2>
          <p className="text-blue-200 text-sm mb-6">
            Get early access + 30% off at launch.<br />
            No spam. Unsubscribe anytime.
          </p>
          <div className="bg-white rounded-xl p-4">
            <EarlyAccessForm />
          </div>
          <p className="text-blue-300 text-xs mt-4">
            Joining 500+ solo founders on the waitlist
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center">
        <p className="text-gray-400 text-xs">
          © 2026 TrendScout · Powered by Google Trends data · Updated daily
        </p>
      </footer>

    </main>
  );
}
