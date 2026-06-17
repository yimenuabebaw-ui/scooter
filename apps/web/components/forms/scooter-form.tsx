"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Scooter, ScooterStatus } from "@/lib/types";

type ScooterFormValues = {
  scooterNumber: string;
  model: string;
  status: ScooterStatus;
  notes: string;
};

const defaultValues: ScooterFormValues = {
  scooterNumber: "",
  model: "",
  status: "available",
  notes: ""
};

export const ScooterForm = ({
  scooter,
  onSubmit,
  onCancel,
  submitting
}: {
  scooter?: Scooter | null;
  onSubmit: (values: ScooterFormValues) => Promise<void>;
  onCancel?: () => void;
  submitting?: boolean;
}) => {
  const [values, setValues] = useState<ScooterFormValues>(defaultValues);

  useEffect(() => {
    if (scooter) {
      setValues({
        scooterNumber: scooter.scooterNumber,
        model: scooter.model,
        status: scooter.status,
        notes: scooter.notes ?? ""
      });
      return;
    }

    setValues(defaultValues);
  }, [scooter]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(values);
  };

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="grid gap-2">
        <Label htmlFor="scooterNumber">Scooter Number</Label>
        <Input
          id="scooterNumber"
          value={values.scooterNumber}
          onChange={(event) => setValues((current) => ({ ...current, scooterNumber: event.target.value }))}
          placeholder="SC-001"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="model">Model</Label>
        <Input
          id="model"
          value={values.model}
          onChange={(event) => setValues((current) => ({ ...current, model: event.target.value }))}
          placeholder="Segway Ninebot"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label>Status</Label>
        <Select value={values.status} onValueChange={(value: ScooterStatus) => setValues((current) => ({ ...current, status: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="rented">Rented</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={values.notes}
          onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))}
          placeholder="Service interval, battery notes, scratches..."
        />
      </div>
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? <Spinner /> : null}
          {scooter ? "Save Changes" : "Add Scooter"}
        </Button>
      </div>
    </form>
  );
};
