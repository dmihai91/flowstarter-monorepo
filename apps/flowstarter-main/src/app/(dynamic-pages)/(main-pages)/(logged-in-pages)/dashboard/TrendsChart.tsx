'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface TrendsChartProps {
  data: Array<{
    name: string;
    Created: number;
    Completed: number;
  }>;
}

export function TrendsChart({ data }: TrendsChartProps) {
  return (
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="Created" fill="#6366f1" />
      <Bar dataKey="Completed" fill="#22c55e" />
    </BarChart>
  );
}
