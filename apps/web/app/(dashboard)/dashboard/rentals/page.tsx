"use client";

import { Download, Pause, Play, Plus, StopCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { RentalForm } from "@/components/forms/rental-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { apiDownload, apiRequest } from "@/lib/api";
import { Rental, Scooter } from "@/lib/types";
import { formatCurrency, formatDateTime, statusLabelMap } from "@/lib/utils";

type RentalFormValues = {
  fullName: string;
  phone: string;
  scooterId: string;
  frontImage: File | null;
};

const blobToObjectUrl = (blob: Blob) => URL.createObjectURL(blob);

const getElapsedSeconds = (rental: Rental, nowMs: number) => {
  const startMs = new Date(rental.startTime).getTime();
  const pausedDurationMs = rental.pausedDurationMs ?? 0;
  const activePauseMs = rental.pauseStartedAt ? Math.max(0, nowMs - new Date(rental.pauseStartedAt).getTime()) : 0;
  const totalMs = Math.max(0, nowMs - startMs - pausedDurationMs - activePauseMs);
  return Math.floor(totalMs / 1000);
};

const secondsToClock = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hours, minutes, secs].map((part) => String(part).padStart(2, "0")).join(":");
};

const getBillableMinutes = (seconds: number) => (seconds === 0 ? 0 : Math.ceil(seconds / 60));

export default function RentalsPage() {
  const [activeRentals, setActiveRentals] = useState<Rental[]>([]);
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerTitle, setViewerTitle] = useState("");
  const [viewerUrl, setViewerUrl] = useState("");
  const [viewerType, setViewerType] = useState("");
  const [viewerLoading, setViewerLoading] = useState(false);

  const loadPage = async () => {
    setLoading(true);
    try {
      const [rentalsResponse, scootersResponse] = await Promise.all([
        apiRequest<Rental[]>("/rentals/active"),
        apiRequest<Scooter[]>("/scooters?status=available&sortBy=scooterNumber&order=asc")
      ]);
      setActiveRentals(rentalsResponse);
      setScooters(scootersResponse);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load rentals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPage();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (viewerUrl) {
        URL.revokeObjectURL(viewerUrl);
      }
    };
  }, [viewerUrl]);

  const createRental = async (values: RentalFormValues) => {
    if (!values.frontImage) {
      toast.error("Front ID image is required");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("fullName", values.fullName);
      formData.append("phone", values.phone);
      formData.append("scooterId", values.scooterId);
      formData.append("frontImage", values.frontImage);

      const created = await apiRequest<Rental>("/rentals", {
        method: "POST",
        body: formData
      });

      toast.success("Rental started");
      setDialogOpen(false);
      setActiveRentals((current) => [created, ...current]);
      setScooters((current) => current.filter((scooter) => scooter._id !== created.scooter._id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start rental");
    } finally {
      setSubmitting(false);
    }
  };

  const runAction = async (id: string, action: "pause" | "resume" | "complete") => {
    setProcessingId(id);
    try {
      const updated = await apiRequest<Rental>(`/rentals/${id}/${action}`, {
        method: "PATCH",
        body: action === "resume" ? {} : { paymentVerified: true }
      });

      toast.success(action === "complete" ? "Rental ended" : action === "pause" ? "Rental paused" : "Rental resumed");

      if (action === "complete") {
        setActiveRentals((current) => current.filter((rental) => rental.id !== id));
        setScooters((current) =>
          [...current, { ...updated.scooter, _id: updated.scooter._id, notes: "", createdAt: "", updatedAt: "" } as Scooter].sort((a, b) =>
            a.scooterNumber.localeCompare(b.scooterNumber)
          )
        );
      } else {
        setActiveRentals((current) => current.map((rental) => (rental.id === id ? updated : rental)));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update rental");
    } finally {
      setProcessingId(null);
    }
  };

  const viewFrontId = async (rental: Rental) => {
    setViewerLoading(true);
    setViewerOpen(true);
    setViewerTitle(`${rental.customer.fullName} - ${rental.scooter.scooterNumber}`);

    try {
      const { blob } = await apiDownload(`/rentals/${rental.id}/documents/front`);
      if (viewerUrl) {
        URL.revokeObjectURL(viewerUrl);
      }
      setViewerType(blob.type);
      setViewerUrl(blobToObjectUrl(blob));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load ID image");
      setViewerOpen(false);
    } finally {
      setViewerLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Live Trips"
        title="Customer and rental management"
        description="Start new rentals, monitor live timers, and pause or end trips after payment verification."
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Create Rental
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:w-[min(94vw,48rem)]">
              <DialogHeader>
                <DialogTitle>Start rental</DialogTitle>
                <DialogDescription>Upload the customer front ID image, select an available scooter, and begin the trip.</DialogDescription>
              </DialogHeader>
              <RentalForm scooters={scooters} onSubmit={createRental} submitting={submitting} />
            </DialogContent>
          </Dialog>
        }
      />

      <Dialog
        open={viewerOpen}
        onOpenChange={(open) => {
          setViewerOpen(open);
          if (!open && viewerUrl) {
            URL.revokeObjectURL(viewerUrl);
            setViewerUrl("");
            setViewerType("");
          }
        }}
      >
        <DialogContent className="sm:w-[min(96vw,64rem)]">
          <DialogHeader>
            <DialogTitle>ID Preview</DialogTitle>
            <DialogDescription>{viewerTitle || "Customer ID front image"}</DialogDescription>
          </DialogHeader>
          <div className="min-h-[22rem] rounded-2xl border border-border/70 bg-background/60 p-4">
            {viewerLoading ? (
              <div className="flex min-h-[20rem] items-center justify-center">
                <Spinner className="h-6 w-6" />
              </div>
            ) : viewerUrl ? (
              viewerType === "application/pdf" ? (
                <iframe title="ID preview" src={viewerUrl} className="h-[58vh] w-full rounded-xl sm:h-[70vh]" />
              ) : (
                <img src={viewerUrl} alt="National ID front" className="max-h-[58vh] w-full rounded-xl object-contain sm:max-h-[70vh]" />
              )
            ) : (
              <div className="flex min-h-[20rem] items-center justify-center text-sm text-muted-foreground">No preview available.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : activeRentals.length === 0 ? (
        <EmptyState title="No active rentals" description="Start a rental to track live time, payment checkpoints, and scooter status." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {activeRentals.map((rental) => {
            const isPaused = Boolean(rental.pauseStartedAt);
            const isProcessing = processingId === rental.id;
            const elapsedSeconds = getElapsedSeconds(rental, nowMs);
            const billableMinutes = getBillableMinutes(elapsedSeconds);
            const currentPrice = rental.baseFee + billableMinutes * rental.pricePerMinute;

            return (
              <Card key={rental.id}>
                <CardHeader className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                  <div>
                    <CardTitle>{rental.customer.fullName}</CardTitle>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {rental.customer.phone} | {rental.scooter.scooterNumber} ({rental.scooter.model})
                    </p>
                  </div>
                  <Badge tone="active">{isPaused ? "Paused" : statusLabelMap[rental.status]}</Badge>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-background/55 p-4">
                      <p className="text-sm text-muted-foreground">Started</p>
                      <p className="mt-2 font-medium">{formatDateTime(rental.startTime)}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/55 p-4">
                      <p className="text-sm text-muted-foreground">Live timer</p>
                      <p className="mt-2 font-medium">{secondsToClock(elapsedSeconds)}</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/55 p-4">
                      <p className="text-sm text-muted-foreground">Billable minutes</p>
                      <p className="mt-2 font-medium">{billableMinutes} min</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/55 p-4">
                      <p className="text-sm text-muted-foreground">Current charge</p>
                      <p className="mt-2 font-medium">{formatCurrency(currentPrice)}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/55 p-4">
                    <p className="text-sm text-muted-foreground">Pricing snapshot</p>
                    <p className="mt-2 font-medium">
                      Base {formatCurrency(rental.baseFee)} + {formatCurrency(rental.pricePerMinute)}/minute
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {isPaused ? (
                      <Button variant="outline" className="w-full sm:w-auto" onClick={() => void runAction(rental.id, "resume")} disabled={isProcessing}>
                        {isProcessing ? <Spinner /> : <Play className="h-4 w-4" />}
                        Resume
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full sm:w-auto" onClick={() => void runAction(rental.id, "pause")} disabled={isProcessing}>
                        {isProcessing ? <Spinner /> : <Pause className="h-4 w-4" />}
                        Pause
                      </Button>
                    )}
                    <Button className="w-full sm:w-auto" onClick={() => void runAction(rental.id, "complete")} disabled={isProcessing}>
                      {isProcessing ? <Spinner /> : <StopCircle className="h-4 w-4" />}
                      End Rental
                    </Button>
                    <Button variant="ghost" className="w-full sm:w-auto" onClick={() => void viewFrontId(rental)}>
                      <Download className="h-4 w-4" />
                      View ID Front
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
