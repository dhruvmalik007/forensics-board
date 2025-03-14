import React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LineChartProps {
  title: string;
  data: Array<Record<string, any>>;
  lines: Array<{
    dataKey: string;
    stroke: string;
    name?: string;
  }>;
  xAxisDataKey: string;
  className?: string;
}

export function LineChart({
  title,
  data,
  lines,
  xAxisDataKey,
  className,
}: LineChartProps) {
  return (
    <Card className={`bg-gray-800/50 border-gray-700 ${className}`}>
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-medium text-gray-200">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart
              data={data}
              margin={{
                top: 10,
                right: 10,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey={xAxisDataKey} 
                stroke="#6b7280" 
                tick={{ fill: "#9ca3af" }}
                tickLine={{ stroke: "#6b7280" }}
              />
              <YAxis 
                stroke="#6b7280" 
                tick={{ fill: "#9ca3af" }}
                tickLine={{ stroke: "#6b7280" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(22, 22, 26, 0.9)",
                  border: "none",
                  borderRadius: "4px",
                  color: "white",
                }}
              />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: "10px",
                  color: "#9ca3af"
                }}
              />
              {lines.map((line, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={line.dataKey}
                  stroke={line.stroke}
                  name={line.name || line.dataKey}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 1 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              ))}
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 