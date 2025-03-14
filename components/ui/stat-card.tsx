import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: string;
    positive: boolean;
  };
  subtitle?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  change,
  subtitle,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("bg-gray-800/50 border-gray-700 hover:border-blue-500 transition-colors", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-200">{title}</h3>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-opacity-20">
            {icon}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-bold text-white">{value}</span>
          {change && (
            <div className="flex items-center mt-1">
              <span
                className={cn(
                  "text-sm flex items-center",
                  change.positive ? "text-green-400" : "text-red-400"
                )}
              >
                {change.positive ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                    <polyline points="16 7 22 7 22 13"></polyline>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
                    <polyline points="16 17 22 17 22 11"></polyline>
                  </svg>
                )}
                {change.value}
              </span>
              {subtitle && <span className="text-gray-400 text-sm ml-2">{subtitle}</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 