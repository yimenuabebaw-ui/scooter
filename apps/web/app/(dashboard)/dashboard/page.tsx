"use client";

import { Bike, Clock3, Wallet, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { apiRequest } from "@/lib/api";
import { DashboardMetrics } from "@/lib/types";
import { formatCurrency, formatDateTime, formatMinutes, statusLabelMap } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await apiRequest<DashboardMetrics>("/dashboard/metrics");
        if (active) {
          setData(response);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    const interval = window.setInterval(load, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Overview"
        title="Operations dashboard"
        description="Track scooter availability, live rentals, and revenue totals at a glance."
      />

      {loading && !data ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : null}

      {data ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Total Scooters" value={String(data.totalScooters)} detail="Fleet inventory count" icon={Bike} />
            <MetricCard
              title="Available Scooters"
              value={String(data.availableScooters)}
              detail="Ready for the next rental"
              icon={Zap}
            />
            <MetricCard title="Active Rentals" value={String(data.activeRentals)} detail="Currently running trips" icon={Clock3} />
            <MetricCard
              title="Today's Revenue"
              value={formatCurrency(data.todayRevenue)}
              detail={`Month total ${formatCurrency(data.monthlyRevenue)}`}
              icon={Wallet}
            />
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Recent rentals</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentRentals.length === 0 ? (
                <EmptyState title="No rentals yet" description="Recent rentals will appear here after the first customer trip is started." />
              ) : (
                <>
                  <div className="space-y-3 md:hidden">
                    {data.recentRentals.map((rental) => (
                      <div key={rental.id} className="rounded-2xl border border-border/70 bg-background/55 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{rental.customer.fullName}</p>
                            <p className="text-xs text-muted-foreground">{rental.customer.phone}</p>
                          </div>
                          <Badge tone={rental.status}>{statusLabelMap[rental.status]}</Badge>
                        </div>
                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Scooter</p>
                            <p className="mt-1 font-medium">{rental.scooter.scooterNumber}</p>
                            <p className="text-xs text-muted-foreground">{rental.scooter.model}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Started</p>
                            <p className="mt-1">{formatDateTime(rental.startTime)}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Duration</p>
                            <p className="mt-1">{formatMinutes(rental.durationMinutes)}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Price</p>
                            <p className="mt-1 font-medium">{formatCurrency(rental.totalPrice)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-muted-foreground">
                        <tr className="border-b border-border/70">
                          <th className="px-3 py-3 font-medium">Customer</th>
                          <th className="px-3 py-3 font-medium">Scooter</th>
                          <th className="px-3 py-3 font-medium">Status</th>
                          <th className="px-3 py-3 font-medium">Start Time</th>
                          <th className="px-3 py-3 font-medium">Duration</th>
                          <th className="px-3 py-3 font-medium">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentRentals.map((rental) => (
                          <tr key={rental.id} className="border-b border-border/50 last:border-b-0">
                            <td className="px-3 py-4">
                              <div className="font-medium">{rental.customer.fullName}</div>
                              <div className="text-xs text-muted-foreground">{rental.customer.phone}</div>
                            </td>
                            <td className="px-3 py-4">
                              <div className="font-medium">{rental.scooter.scooterNumber}</div>
                              <div className="text-xs text-muted-foreground">{rental.scooter.model}</div>
                            </td>
                            <td className="px-3 py-4">
                              <Badge tone={rental.status}>{statusLabelMap[rental.status]}</Badge>
                            </td>
                            <td className="px-3 py-4">{formatDateTime(rental.startTime)}</td>
                            <td className="px-3 py-4">{formatMinutes(rental.durationMinutes)}</td>
                            <td className="px-3 py-4">{formatCurrency(rental.totalPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
