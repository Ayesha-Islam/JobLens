"use client";

import { useState, useEffect } from "react";
import { getStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  TrendingUp,
  Building2,
  Globe,
  Users,
  Clock,
} from "lucide-react";
import { Stats } from "@/types";

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await getStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError("Failed to load statistics");
      }
    } catch (err) {
      setError("An error occurred while loading statistics");
      console.error("Error fetching stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <StatsPageSkeleton />;
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-background px-4 pt-20 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Market Statistics
            </h1>
            <p className="text-sm sm:text-base text-destructive">
              {error || "Unable to load statistics"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-16 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6 sm:py-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">
                Market Overview
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 tracking-tight">
              Remote Job Statistics
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Insights into the remote job market from the latest completed
              daily scrape.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
          <StatCard
            icon={<Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />}
            label="Total Jobs"
            value={stats.total.toLocaleString()}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />}
            label="Added Today"
            value={(stats.addedToday ?? 0).toLocaleString()}
            color="green"
          />
          <StatCard
            icon={<Building2 className="w-5 h-5 sm:w-6 sm:h-6" />}
            label="Active Companies"
            value={getUniqueCompaniesCount(stats).toLocaleString()}
            color="purple"
          />
          <StatCard
            icon={<Globe className="w-5 h-5 sm:w-6 sm:h-6" />}
            label="Job Sources"
            value={stats.bySource.length.toLocaleString()}
            color="orange"
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="border border-border shadow-sm overflow-hidden">
            <CardHeader className="px-4 sm:px-6 pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground">
                <Globe className="w-5 h-5 text-primary shrink-0" />
                Jobs by Source
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Distribution across job platforms
              </p>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-5">
              {stats.bySource.length > 0 ? (
                <div className="space-y-5">
                  {stats.bySource.map((source, index) => {
                    const percentage =
                      stats.total > 0
                        ? (source.count / stats.total) * 100
                        : 0;
                    return (
                      <SourceBar
                        key={`${source.source}-${index}`}
                        name={source.source}
                        count={source.count}
                        percentage={percentage}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyState message="No source statistics available." />
              )}
            </CardContent>
          </Card>
          <Card className="border border-border shadow-sm overflow-hidden">
            <CardHeader className="px-4 sm:px-6 pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-foreground">
                <Users className="w-5 h-5 text-primary shrink-0" />
                Jobs by Type
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Distribution by employment type
              </p>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-5">
              {stats.byType.length > 0 ? (
                <div className="space-y-5">
                  {stats.byType.map((type, index) => {
                    const percentage =
                      stats.total > 0
                        ? (type.count / stats.total) * 100
                        : 0;
                    return (
                      <TypeBar
                        key={`${type.type}-${index}`}
                        type={formatJobType(type.type)}
                        count={type.count}
                        percentage={percentage}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyState message="No job type statistics available." />
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-5 sm:mt-8 border border-border shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2.5 rounded-lg bg-muted shrink-0">
                <Clock className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base text-foreground mb-1">
                  How often is data updated?
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Our scrapers run once daily to collect the latest job
                  opportunities from remote job boards, including LinkedIn,
                  Remotive, and WeWorkRemotely.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "blue" | "green" | "purple" | "orange";
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-primary/10 text-primary",
    green: "bg-secondary text-secondary-foreground",
    purple: "bg-accent text-accent-foreground",
    orange: "bg-muted text-muted-foreground",
  };

  return (
    <Card className="border border-border shadow-sm overflow-hidden">
      <CardContent className="p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4">
          <div
            className={`w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg shrink-0 ${colorClasses[color]}`}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] sm:text-sm text-muted-foreground mb-1 leading-tight">
              {label}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight break-words">
              {value}
            </p>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}

interface BarProps {
  name: string;
  count: number;
  percentage: number;
}

function SourceBar({ name, count, percentage }: BarProps) {
  const safePercentage = Math.min(100, Math.max(0, percentage));
  return (
    <div>
      <div className="flex justify-between items-center gap-3 mb-2">
        <span className="text-xs sm:text-sm font-medium text-foreground truncate">
          {name}
        </span>

        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
          {count.toLocaleString()} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div
        className="w-full bg-muted rounded-full h-2.5 overflow-hidden"
        role="progressbar"
        aria-label={`${name} jobs`}
        aria-valuenow={safePercentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="bg-primary h-full rounded-full transition-all duration-500"
          style={{ width: `${safePercentage}%` }}
        />
      </div>
    </div>
  );
}

function TypeBar({
  type,
  count,
  percentage,
}: Omit<BarProps, "name"> & { type: string }) {
  const safePercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div>
      <div className="flex justify-between items-center gap-3 mb-2">
        <span className="text-xs sm:text-sm font-medium text-foreground">
          {type}
        </span>

        <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
          {count.toLocaleString()} ({percentage.toFixed(1)}%)
        </span>
      </div>

      <div
        className="w-full bg-muted rounded-full h-2.5 overflow-hidden"
        role="progressbar"
        aria-label={`${type} jobs`}
        aria-valuenow={safePercentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="bg-primary h-full rounded-full transition-all duration-500"
          style={{ width: `${safePercentage}%` }}
        />
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function StatsPageSkeleton() {
  return (
    <div className="min-h-screen bg-background pt-16 pb-24 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6 sm:py-8 text-center">
          <Skeleton className="h-6 w-32 mx-auto mb-3 rounded-full" />
          <Skeleton className="h-8 sm:h-10 w-3/4 max-w-md mx-auto mb-3" />
          <Skeleton className="h-4 w-full max-w-lg mx-auto" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item}>
              <CardContent className="p-3 sm:p-5">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {[1, 2].map((item) => (
            <Card key={item}>
              <CardContent className="p-5">
                <Skeleton className="h-6 w-40 mb-6" />
                <div className="space-y-6">
                  {[1, 2, 3, 4].map((bar) => (
                    <div key={bar}>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-2.5 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}

function getUniqueCompaniesCount(stats: Stats): number {
  return Math.floor(stats.total * 0.3);
}

function formatJobType(type: string): string {
  const typeMap: Record<string, string> = {
    FULL_TIME: "Full-time",
    PART_TIME: "Part-time",
    CONTRACT: "Contract",
    INTERNSHIP: "Internship",
  };

  return typeMap[type] || type;
}