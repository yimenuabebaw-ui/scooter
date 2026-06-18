"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { apiDownload, apiRequest } from "@/lib/api";
import { RevenueReport } from "@/lib/types";
import { formatCurrency, formatDateTime, formatMinutes } from "@/lib/utils";

const saveBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export default function ReportsPage() {
  const [preset, setPreset] = useState<"daily" | "monthly" | "custom">("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<"excel" | "pdf" | null>(null);

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        preset,
        ...(preset === "custom" && startDate ? { startDate } : {}),
        ...(preset === "custom" && endDate ? { endDate } : {})
      });
      const response = await apiRequest<RevenueReport>(`/reports?${params.toString()}`);
      setReport(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport();
  }, [preset, startDate, endDate]);

  const download = async (format: "excel" | "pdf") => {
    setDownloading(format);
    try {
      const params = new URLSearchParams({
        preset,
        format,
        ...(preset === "custom" && startDate ? { startDate } : {}),
        ...(preset === "custom" && endDate ? { endDate } : {})
      });
      const { blob, filename } = await apiDownload(`/reports/export?${params.toString()}`);
      saveBlob(blob, filename);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Revenue"
        title="Reports and exports"
        description="View daily, monthly, or custom-range revenue and export the selected report to Excel or PDF."
      />

      <Card>
        <CardContent className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-[0.8fr_1fr_1fr_auto_auto]">
          <Select value={preset} onValueChange={(value: "daily" | "monthly" | "custom") => setPreset(value)}>
            <SelectTrigger><SelectValue placeholder="Preset" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} disabled={preset !== "custom"} />
          <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} disabled={preset !== "custom"} />
          <Button className="w-full xl:w-auto" variant="outline" onClick={() => void download("excel")} disabled={downloading !== null}>
            {downloading === "excel" ? <Spinner /> : <FileSpreadsheet className="h-4 w-4" />}
            Excel
          </Button>
          <Button className="w-full xl:w-auto" onClick={() => void download("pdf")} disabled={downloading !== null}>
            {downloading === "pdf" ? <Spinner /> : <FileText className="h-4 w-4" />}
            PDF
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : report ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Revenue</p><p className="mt-2 font-display text-3xl font-bold">{formatCurrency(report.totalRevenue)}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Rentals</p><p className="mt-2 font-display text-3xl font-bold">{report.rentalCount}</p></CardContent></Card>
            <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Average Rental Value</p><p className="mt-2 font-display text-3xl font-bold">{formatCurrency(report.averageRentalValue)}</p></CardContent></Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>{report.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(report.startDate)} to {formatDateTime(report.endDate)}
              </p>
            </CardHeader>
            <CardContent>
              {report.rentals.length === 0 ? (
                <EmptyState title="No completed rentals in range" description="Choose a different period or complete more rentals to generate report rows." />
              ) : (
                <>
                  <div className="space-y-3 md:hidden">
                    {report.rentals.map((item, index) => (
                      <div key={`${item.customerName}-${index}`} className="rounded-2xl border border-border/70 bg-background/55 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{item.customerName}</p>
                            <p className="text-xs text-muted-foreground">{item.phoneNumber}</p>
                          </div>
                          <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                        </div>
                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Scooter</p>
                            <p className="mt-1">{item.scooterNumber}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Duration</p>
                            <p className="mt-1">{formatMinutes(item.durationMinutes)}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Start</p>
                            <p className="mt-1">{formatDateTime(item.startTime)}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">End</p>
                            <p className="mt-1">{formatDateTime(item.endTime)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b border-border/70 text-muted-foreground">
                        <tr>
                          <th className="px-3 py-3 font-medium">Customer</th>
                          <th className="px-3 py-3 font-medium">Scooter</th>
                          <th className="px-3 py-3 font-medium">Start</th>
                          <th className="px-3 py-3 font-medium">End</th>
                          <th className="px-3 py-3 font-medium">Duration</th>
                          <th className="px-3 py-3 font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.rentals.map((item, index) => (
                          <tr key={`${item.customerName}-${index}`} className="border-b border-border/50 last:border-b-0">
                            <td className="px-3 py-4">
                              <div className="font-medium">{item.customerName}</div>
                              <div className="text-xs text-muted-foreground">{item.phoneNumber}</div>
                            </td>
                            <td className="px-3 py-4">{item.scooterNumber}</td>
                            <td className="px-3 py-4">{formatDateTime(item.startTime)}</td>
                            <td className="px-3 py-4">{formatDateTime(item.endTime)}</td>
                            <td className="px-3 py-4">{formatMinutes(item.durationMinutes)}</td>
                            <td className="px-3 py-4">{formatCurrency(item.totalPrice)}</td>
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
