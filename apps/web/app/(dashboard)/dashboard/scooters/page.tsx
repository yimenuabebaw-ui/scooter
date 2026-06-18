"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, SquarePen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { ScooterForm } from "@/components/forms/scooter-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTrigger,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { apiRequest } from "@/lib/api";
import { Scooter, ScooterStatus } from "@/lib/types";
import { formatDateTime, statusLabelMap } from "@/lib/utils";

export default function ScootersPage() {
  const [scooters, setScooters] = useState<Scooter[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Scooter | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ScooterStatus>("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "scooterNumber" | "status">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadScooters = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        sortBy,
        order: sortOrder,
        ...(statusFilter !== "all" ? { status: statusFilter } : {})
      });
      const response = await apiRequest<Scooter[]>(`/scooters?${query.toString()}`);
      setScooters(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load scooters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadScooters();
  }, [search, statusFilter, sortBy, sortOrder]);

  const statusCounts = useMemo(
    () => ({
      available: scooters.filter((item) => item.status === "available").length,
      rented: scooters.filter((item) => item.status === "rented").length,
      maintenance: scooters.filter((item) => item.status === "maintenance").length
    }),
    [scooters]
  );

  const submitScooter = async (values: { scooterNumber: string; model: string; status: ScooterStatus; notes: string }) => {
    setSubmitting(true);
    try {
      if (editing) {
        await apiRequest(`/scooters/${editing._id}`, {
          method: "PATCH",
          body: values
        });
        toast.success("Scooter updated");
      } else {
        await apiRequest("/scooters", {
          method: "POST",
          body: values
        });
        toast.success("Scooter added");
      }

      setDialogOpen(false);
      setEditing(null);
      await loadScooters();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save scooter");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteScooter = async (id: string) => {
    setDeletingId(id);
    try {
      await apiRequest(`/scooters/${id}`, { method: "DELETE" });
      toast.success("Scooter removed");
      await loadScooters();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete scooter");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        eyebrow="Fleet"
        title="Scooter management"
        description="Add, update, and monitor scooter status for rentals and maintenance."
        actions={
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditing(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}>
                <Plus className="h-4 w-4" />
                Add Scooter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit scooter" : "Add scooter"}</DialogTitle>
                <DialogDescription>Set the scooter number, model, availability state, and optional notes.</DialogDescription>
              </DialogHeader>
              <ScooterForm scooter={editing} onSubmit={submitScooter} onCancel={() => setDialogOpen(false)} submitting={submitting} />
            </DialogContent>
          </Dialog>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Available</p><p className="mt-2 font-display text-3xl font-bold">{statusCounts.available}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Rented</p><p className="mt-2 font-display text-3xl font-bold">{statusCounts.rented}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Maintenance</p><p className="mt-2 font-display text-3xl font-bold">{statusCounts.maintenance}</p></CardContent></Card>
      </section>

      <Card>
        <CardContent className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search number or model" />
          </div>
          <Select value={statusFilter} onValueChange={(value: "all" | ScooterStatus) => setStatusFilter(value)}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="rented">Rented</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: "createdAt" | "scooterNumber" | "status") => setSortBy(value)}>
            <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created At</SelectItem>
              <SelectItem value="scooterNumber">Scooter Number</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
            <SelectTrigger><SelectValue placeholder="Order" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Descending</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : scooters.length === 0 ? (
        <EmptyState title="No scooters found" description="Add the first scooter to start inventory tracking and rentals." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="space-y-3 p-4 md:hidden">
              {scooters.map((scooter) => (
                <div key={scooter._id} className="rounded-2xl border border-border/70 bg-background/55 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{scooter.scooterNumber}</p>
                      <p className="text-xs text-muted-foreground">{scooter.model}</p>
                    </div>
                    <Badge tone={scooter.status}>{statusLabelMap[scooter.status]}</Badge>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
                      <p className="mt-1 break-words text-muted-foreground">{scooter.notes || "No notes"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Updated</p>
                      <p className="mt-1">{formatDateTime(scooter.updatedAt)}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setEditing(scooter);
                        setDialogOpen(true);
                      }}
                    >
                      <SquarePen className="h-4 w-4" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete scooter?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This removes {scooter.scooterNumber}. Scooters with active rentals cannot be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => void deleteScooter(scooter._id)}>
                            {deletingId === scooter._id ? <Spinner /> : null}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Scooter</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Notes</th>
                    <th className="px-4 py-3 font-medium">Updated</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scooters.map((scooter) => (
                    <tr key={scooter._id} className="border-t border-border/60">
                      <td className="px-4 py-4">
                        <div className="font-medium">{scooter.scooterNumber}</div>
                        <div className="text-xs text-muted-foreground">{scooter.model}</div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={scooter.status}>{statusLabelMap[scooter.status]}</Badge>
                      </td>
                      <td className="max-w-md px-4 py-4 text-muted-foreground">{scooter.notes || "No notes"}</td>
                      <td className="px-4 py-4">{formatDateTime(scooter.updatedAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditing(scooter);
                              setDialogOpen(true);
                            }}
                          >
                            <SquarePen className="h-4 w-4" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete scooter?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This removes {scooter.scooterNumber}. Scooters with active rentals cannot be deleted.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => void deleteScooter(scooter._id)}>
                                  {deletingId === scooter._id ? <Spinner /> : null}
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
