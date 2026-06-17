"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Settings } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export const SettingsForm = ({
  settings,
  onSubmit,
  submitting
}: {
  settings: Settings | null;
  onSubmit: (values: { baseFee: number; pricePerMinute: number }) => Promise<void>;
  submitting?: boolean;
}) => {
  const [baseFee, setBaseFee] = useState("30");
  const [pricePerMinute, setPricePerMinute] = useState("8");

  useEffect(() => {
    if (!settings) {
      return;
    }

    setBaseFee(String(settings.baseFee));
    setPricePerMinute(String(settings.pricePerMinute));
  }, [settings]);

  const parsedBaseFee = Number(baseFee || 0);
  const parsedPricePerMinute = Number(pricePerMinute || 0);
  const sample10 = parsedBaseFee + 10 * parsedPricePerMinute;
  const sample25 = parsedBaseFee + 25 * parsedPricePerMinute;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      baseFee: parsedBaseFee,
      pricePerMinute: parsedPricePerMinute
    });
  };

  return (
    <form className="grid gap-5" onSubmit={submit}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="baseFee">Base Fee (ETB)</Label>
          <Input id="baseFee" type="number" min="0" value={baseFee} onChange={(event) => setBaseFee(event.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pricePerMinute">Price Per Minute (ETB)</Label>
          <Input
            id="pricePerMinute"
            type="number"
            min="0"
            value={pricePerMinute}
            onChange={(event) => setPricePerMinute(event.target.value)}
            required
          />
        </div>
      </div>
      <div className="rounded-2xl border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Current formula</p>
        <p className="mt-2">Total Price = Base Fee + (Total Minutes × Price Per Minute)</p>
        <p className="mt-2">10 minutes: {formatCurrency(sample10)}</p>
        <p>25 minutes: {formatCurrency(sample25)}</p>
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? <Spinner /> : null}
        Save Pricing
      </Button>
    </form>
  );
};
