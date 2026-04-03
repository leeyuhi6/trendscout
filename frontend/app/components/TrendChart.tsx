"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function TrendChart({ data }: { data: any[] }) {
  const chartData = data.slice(0, 10).map(item => ({
    name: item.keyword.slice(0, 20),
    heat: item.avg_heat
  }));

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold mb-4">Top 10 Trends</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="heat" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
