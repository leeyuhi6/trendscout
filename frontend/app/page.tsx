"use client";

import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchTrends = async () => {
    setLoading(true);
    try {
      const url = query 
        ? `http://localhost:8000/api/keywords/search?q=${query}&limit=20`
        : `http://localhost:8000/api/keywords/trending?limit=20`;
      
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
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            TrendScout
          </h1>
          <p className="text-xl text-gray-600">
            AI-Powered Keyword Trend Discovery
          </p>
        </div>

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
          )}
        </div>
      </div>
    </main>
  );
}
