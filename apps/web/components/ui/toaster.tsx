"use client";

import { Toaster } from "sonner";

export const AppToaster = () => (
  <Toaster position="top-right" richColors toastOptions={{ className: "font-body" }} />
);
