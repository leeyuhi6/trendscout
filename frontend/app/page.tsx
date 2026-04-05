"use client";

import { useState } from "react";
import TrendChart from "./components/TrendChart";

interface KeywordItem {
  keyword: string;
  avg_heat: number;
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
      // 提交到我们自己的 API，后端转发到 EmailOctopus 或直接存储
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.trendscout.dev";
      const res = await fetch(`${apiBase}/api/subscribe`, {
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
          We&apos;ll send you early access + weekly trending keywords.
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
        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm whitespace-nowrap disabled:bg-gray-400"
      >
        {status === "loading" ? "Joining..." : "Get Early Access →"}
      </button>
      {errorMsg && (
        <p className="text-red-500 text-xs mt-1 sm:col-span-2">{errorMsg}</p>
      )}
    </form>
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            TrendScout
          </h1>
          <p className="text-xl text-gray-600">
            AI-Powered Keyword Trend Discovery
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <input
              type="text"
              placeholder="Search trending keywords..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchTrends()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={searchTrends}
              disabled={loading}
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? "Loading..." : "Search Trends"}
            </button>
          </div>

          {results.length > 0 && (
            <>
              <TrendChart data={results} />

              <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-4">Results</h2>
                <div className="space-y-3">
                  {results.map((item, idx) => (
                    <div key={idx} className="p-4 border rounded hover:bg-gray-50">
                      <div className="flex justify-between">
                        <span className="font-medium">{item.keyword}</span>
                        <span className="text-blue-600">Heat: {item.avg_heat}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Early Access Section */}
        <div className="max-w-2xl mx-auto mt-16">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="text-center mb-6">
              <div className="text-3xl mb-2">🚀</div>
              <h2 className="text-2xl font-bold mb-2">Get Early Access</h2>
              <p className="text-blue-100 text-sm">
                Join <strong>200+ marketers & founders</strong> discovering trending keywords before competitors.
                <br />
                Free weekly trend report included.
              </p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <EarlyAccessForm />
            </div>
            <p className="text-center text-blue-200 text-xs mt-4">
              No spam. Unsubscribe anytime. Early access = 30% off launch price.
            </p>
          </div>
        </div>

        {/* Social Proof */}
        <div className="max-w-2xl mx-auto mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Powered by Google Trends data · Updated daily · 700+ keywords tracked
          </p>
        </div>

      </div>
    </main>
  );
}
