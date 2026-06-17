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
    <div className="space-y-8">
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
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                <div className="overflow-x-auto">
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
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
