"use client";

import { Download, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { apiDownload, apiRequest } from "@/lib/api";
import { RentalHistoryResponse } from "@/lib/types";
import { formatCurrency, formatDateTime, formatMinutes, statusLabelMap } from "@/lib/utils";

const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export default function HistoryPage() {
  const [filters, setFilters] = useState({
    customerName: "",
    phoneNumber: "",
    scooterNumber: "",
    startDate: "",
    endDate: ""
  });
  const [data, setData] = useState<RentalHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleanupDays, setCleanupDays] = useState("30");
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(
        Object.entries(filters).filter(([, value]) => value).reduce((accumulator, [key, value]) => ({ ...accumulator, [key]: value }), {})
      );
      const response = await apiRequest<RentalHistoryResponse>(`/rentals/history?${query.toString()}`);
      setData(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, [filters]);

  const downloadDocument = async (rentalId: string) => {
    try {
      const { blob, filename } = await apiDownload(`/rentals/${rentalId}/documents/front?download=1`);
      saveBlob(blob, filename);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Download failed");
    }
  };

  const cleanupOldIds = async () => {
    const days = Number(cleanupDays);

    if (!Number.isFinite(days) || days <= 0) {
      toast.error("Enter a valid number of days");
      return;
    }

    setCleanupLoading(true);
    try {
      const response = await apiRequest<{ deletedCount: number }>(`/rentals/history/ids?days=${days}`, {
        method: "DELETE"
      });
      toast.success(`Deleted ${response.deletedCount} ID image${response.deletedCount === 1 ? "" : "s"}`);
      await loadHistory();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cleanup failed");
    } finally {
      setCleanupLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="History"
        title="Completed rentals"
        description="Search completed rentals by customer, phone, scooter number, and date range."
      />

      <Card>
        <CardContent className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              value={filters.customerName}
              onChange={(event) => setFilters((current) => ({ ...current, customerName: event.target.value }))}
              placeholder="Customer name"
            />
          </div>
          <Input value={filters.phoneNumber} onChange={(event) => setFilters((current) => ({ ...current, phoneNumber: event.target.value }))} placeholder="Phone number" />
          <Input value={filters.scooterNumber} onChange={(event) => setFilters((current) => ({ ...current, scooterNumber: event.target.value }))} placeholder="Scooter number" />
          <Input type="date" value={filters.startDate} onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))} />
          <Input type="date" value={filters.endDate} onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="font-medium">Delete old front ID images</p>
            <p className="text-sm text-muted-foreground">
              Remove stored front ID files from completed rentals that ended at least this many days ago.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              type="number"
              min="1"
              value={cleanupDays}
              onChange={(event) => setCleanupDays(event.target.value)}
              className="w-full sm:w-32"
            />
            <Button className="w-full sm:w-auto" variant="destructive" onClick={() => void cleanupOldIds()} disabled={cleanupLoading}>
              {cleanupLoading ? <Spinner /> : <Trash2 className="h-4 w-4" />}
              Delete Old IDs
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : data && data.rentals.length > 0 ? (
        <>
          <Card>
            <CardContent className="flex flex-col items-start justify-between gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
              <div>
                <p className="text-sm text-muted-foreground">Completed rental revenue</p>
                <p className="mt-2 font-display text-3xl font-bold">{formatCurrency(data.totalRevenue)}</p>
              </div>
              <p className="text-sm text-muted-foreground">{data.rentals.length} completed rentals in view</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <div className="space-y-3 p-4 md:hidden">
                {data.rentals.map((rental) => (
                  <div key={rental.id} className="rounded-2xl border border-border/70 bg-background/55 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{rental.customerName}</p>
                        <p className="text-xs text-muted-foreground">{rental.phoneNumber}</p>
                      </div>
                      <Badge tone={rental.status}>{statusLabelMap[rental.status]}</Badge>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Scooter</p>
                        <p className="mt-1">{rental.scooterNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Duration</p>
                        <p className="mt-1">{formatMinutes(rental.durationMinutes)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Start</p>
                        <p className="mt-1">{formatDateTime(rental.startTime)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">End</p>
                        <p className="mt-1">{formatDateTime(rental.endTime)}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-medium">{formatCurrency(rental.totalPrice)}</p>
                      {rental.nationalIdFrontImage ? (
                        <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => void downloadDocument(rental.id)}>
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Deleted</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Scooter</th>
                      <th className="px-4 py-3 font-medium">Start</th>
                      <th className="px-4 py-3 font-medium">End</th>
                      <th className="px-4 py-3 font-medium">Duration</th>
                      <th className="px-4 py-3 font-medium">Total</th>
                      <th className="px-4 py-3 font-medium">ID Front</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rentals.map((rental) => (
                      <tr key={rental.id} className="border-t border-border/60">
                        <td className="px-4 py-4">
                          <div className="font-medium">{rental.customerName}</div>
                          <div className="text-xs text-muted-foreground">{rental.phoneNumber}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium">{rental.scooterNumber}</div>
                          <Badge tone={rental.status}>{statusLabelMap[rental.status]}</Badge>
                        </td>
                        <td className="px-4 py-4">{formatDateTime(rental.startTime)}</td>
                        <td className="px-4 py-4">{formatDateTime(rental.endTime)}</td>
                        <td className="px-4 py-4">{formatMinutes(rental.durationMinutes)}</td>
                        <td className="px-4 py-4">{formatCurrency(rental.totalPrice)}</td>
                        <td className="px-4 py-4">
                          {rental.nationalIdFrontImage ? (
                            <Button variant="outline" size="sm" onClick={() => void downloadDocument(rental.id)}>
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Deleted</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState title="No completed rentals found" description="Adjust the filters or complete active rentals to populate history." />
      )}
    </div>
  );
}
