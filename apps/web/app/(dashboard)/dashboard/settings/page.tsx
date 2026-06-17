"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsForm } from "@/components/forms/settings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { apiRequest } from "@/lib/api";
import { Settings } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await apiRequest<Settings>("/settings");
      setSettings(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const updateSettings = async (values: { baseFee: number; pricePerMinute: number }) => {
    setSaving(true);
    try {
      const response = await apiRequest<Settings>("/settings", {
        method: "PUT",
        body: values
      });
      setSettings(response);
      toast.success("Pricing updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save pricing");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Pricing"
        title="Pricing configuration"
        description="Update the base fee and per-minute price. New rentals will always snapshot the current values from settings."
      />

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Rental pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <SettingsForm settings={settings} onSubmit={updateSettings} submitting={saving} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
