"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Scooter } from "@/lib/types";

type RentalFormValues = {
  fullName: string;
  phone: string;
  scooterId: string;
  frontImage: File | null;
};

const accepted = ".jpg,.jpeg,.png,.pdf";

export const RentalForm = ({
  scooters,
  onSubmit,
  submitting
}: {
  scooters: Scooter[];
  onSubmit: (values: RentalFormValues) => Promise<void>;
  submitting?: boolean;
}) => {
  const [values, setValues] = useState<RentalFormValues>({
    fullName: "",
    phone: "",
    scooterId: "",
    frontImage: null
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(values);
  };

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <div className="grid gap-2">
        <Label htmlFor="fullName">Customer Full Name</Label>
        <Input
          id="fullName"
          value={values.fullName}
          onChange={(event) => setValues((current) => ({ ...current, fullName: event.target.value }))}
          placeholder="Abel Tadesse"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          value={values.phone}
          onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))}
          placeholder="0912345678"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label>Scooter</Label>
        <Select value={values.scooterId} onValueChange={(value) => setValues((current) => ({ ...current, scooterId: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select available scooter" />
          </SelectTrigger>
          <SelectContent>
            {scooters.map((scooter) => (
              <SelectItem key={scooter._id} value={scooter._id}>
                {scooter.scooterNumber} - {scooter.model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="frontImage">National ID Front</Label>
        <Input
          id="frontImage"
          type="file"
          accept={accepted}
          required
          onChange={(event) => setValues((current) => ({ ...current, frontImage: event.target.files?.[0] ?? null }))}
        />
      </div>
      <Button type="submit" disabled={submitting || scooters.length === 0}>
        {submitting ? <Spinner /> : null}
        Start Rental
      </Button>
    </form>
  );
};
