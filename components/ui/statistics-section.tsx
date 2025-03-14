import React from "react";
import { StatCard } from "@/components/ui/stat-card";
import { PieChart } from "@/components/ui/pie-chart";
import { LineChart } from "@/components/ui/line-chart";
import { StatsProvider, useStats } from "@/components/ui/stats-data-provider";

export function StatisticsSection() {
  return (
    <StatsProvider>
      <StatisticsContent />
    </StatsProvider>
  );
}

function StatisticsContent() {
  const stats = useStats();

  return (
    <section className="py-16 bg-gray-800/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Platform Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Graphs */}
          <StatCard
            title="Total Graphs"
            value={stats.totalGraphs.value}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            }
            change={stats.totalGraphs.change}
            subtitle={stats.totalGraphs.subtitle}
          />

          {/* Transactions Monitored */}
          <StatCard
            title="Transactions Monitored"
            value={stats.transactionsMonitored.value}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            }
            change={stats.transactionsMonitored.change}
            subtitle={stats.transactionsMonitored.subtitle}
          />

          {/* Chains Supported */}
          <StatCard
            title="Chains Supported"
            value={stats.chainsSupported.value}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-purple-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            }
            change={stats.chainsSupported.change}
            subtitle={stats.chainsSupported.subtitle}
          />

          {/* Active Users */}
          <StatCard
            title="Active Users"
            value={stats.activeUsers.value}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-amber-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            }
            change={stats.activeUsers.change}
            subtitle={stats.activeUsers.subtitle}
          />
        </div>

        {/* Charts */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Graph Distribution Chart */}
          <PieChart
            title="Graph Distribution by Chain"
            data={stats.chainDistribution}
          />

          {/* Transaction Activity Chart */}
          <LineChart
            title="Transaction Activity"
            data={stats.transactionActivity}
            xAxisDataKey="date"
            lines={[
              { dataKey: "tokenTransfers", stroke: "#3b82f6", name: "Token Transfers" },
              { dataKey: "crossChainActivity", stroke: "#10b981", name: "Cross-Chain Activity" },
            ]}
          />
        </div>
      </div>
    </section>
  );
} 