"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartBar,
  CalendarBlank,
  TrendUp,
  Fire,
} from "@phosphor-icons/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Generation {
  id: string;
  created_at: string;
}

type TimeRange = "7d" | "30d" | "3mo" | "all";

const ranges: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "3mo", label: "3 months" },
  { value: "all", label: "All time" },
];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDay(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatWeek(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function getDateRange(range: TimeRange): Date | null {
  const now = new Date();
  switch (range) {
    case "7d":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    case "30d":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
    case "3mo":
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case "all":
      return null;
  }
}

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return startOfDay(d);
}

export default function AnalyticsPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<TimeRange>("30d");

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => setGenerations(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const { chartData, stats } = useMemo(() => {
    const cutoff = getDateRange(range);
    const filtered = cutoff
      ? generations.filter((g) => new Date(g.created_at) >= cutoff)
      : generations;

    const useWeeks = range === "3mo" || range === "all";

    const buckets: Record<string, number> = {};

    if (useWeeks) {
      for (const g of filtered) {
        const weekStart = getWeekStart(new Date(g.created_at));
        const key = weekStart.toISOString().split("T")[0];
        buckets[key] = (buckets[key] || 0) + 1;
      }
    } else {
      const start = cutoff ?? new Date(0);
      const today = startOfDay(new Date());
      for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
        buckets[d.toISOString().split("T")[0]] = 0;
      }
      for (const g of filtered) {
        const key = startOfDay(new Date(g.created_at))
          .toISOString()
          .split("T")[0];
        if (key in buckets) buckets[key] = (buckets[key] || 0) + 1;
      }
    }

    const sortedKeys = Object.keys(buckets).sort();
    const chartData = sortedKeys.map((key) => ({
      date: key,
      label: useWeeks ? `Week of ${formatWeek(key)}` : formatDay(key),
      count: buckets[key],
    }));

    const total = filtered.length;
    const numBuckets = sortedKeys.length || 1;
    const avg = total / numBuckets;

    let busiestKey = "";
    let busiestCount = 0;
    for (const key of sortedKeys) {
      if (buckets[key] > busiestCount) {
        busiestCount = buckets[key];
        busiestKey = key;
      }
    }

    const dayBuckets: Record<string, number> = {};
    for (const g of generations) {
      const key = startOfDay(new Date(g.created_at))
        .toISOString()
        .split("T")[0];
      dayBuckets[key] = (dayBuckets[key] || 0) + 1;
    }
    let streak = 0;
    const checkDate = startOfDay(new Date());
    for (let i = 0; i < 365; i++) {
      const key = checkDate.toISOString().split("T")[0];
      if (dayBuckets[key] && dayBuckets[key] > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      chartData,
      stats: {
        total,
        avg: avg.toFixed(1),
        busiestLabel: busiestKey
          ? useWeeks
            ? `Week of ${formatWeek(busiestKey)}`
            : formatDay(busiestKey)
          : "—",
        busiestCount,
        streak,
        useWeeks,
      },
    };
  }, [generations, range]);

  return (
    <div className="space-y-8">
      <div className="animate-fade-in-up stagger-1">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Track your content generation activity over time.
        </p>
      </div>

      <div className="flex gap-2 animate-fade-in-up stagger-2">
        {ranges.map((r) => (
          <Button
            key={r.value}
            variant={range === r.value ? "default" : "outline"}
            size="sm"
            onClick={() => setRange(r.value)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in-up stagger-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <ChartBar className="h-4 w-4 text-primary" weight="duotone" />
              </div>
              <div>
                <p className="text-2xl font-heading font-semibold tracking-tight">
                  {stats.total}
                </p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-warm/10 p-2">
                <TrendUp className="h-4 w-4 text-warm" weight="duotone" />
              </div>
              <div>
                <p className="text-2xl font-heading font-semibold tracking-tight">
                  {stats.avg}
                </p>
                <p className="text-xs text-muted-foreground">
                  Avg / {stats.useWeeks ? "week" : "day"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <CalendarBlank className="h-4 w-4 text-muted-foreground" weight="duotone" />
              </div>
              <div>
                <p className="text-2xl font-heading font-semibold tracking-tight">
                  {stats.busiestCount}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {stats.busiestLabel}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Fire className="h-4 w-4 text-primary" weight="duotone" />
              </div>
              <div>
                <p className="text-2xl font-heading font-semibold tracking-tight">
                  {stats.streak}
                </p>
                <p className="text-xs text-muted-foreground">Day streak</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="animate-fade-in-up stagger-4">
        <CardContent className="p-6">
          <h2 className="font-heading text-sm font-semibold mb-4">
            Generations per {stats.useWeeks ? "week" : "day"}
          </h2>
          {loading ? (
            <div className="h-[300px] rounded-lg bg-muted/50 shimmer-bg" />
          ) : chartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              No data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                  interval={
                    chartData.length > 14
                      ? Math.ceil(chartData.length / 10)
                      : 0
                  }
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    color: "var(--popover-foreground)",
                    fontSize: "13px",
                  }}
                  formatter={(value) => [value as number, "Generations"]}
                  labelFormatter={(label) => String(label)}
                  cursor={{ fill: "var(--accent)", opacity: 0.3 }}
                />
                <Bar
                  dataKey="count"
                  fill="var(--primary)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
