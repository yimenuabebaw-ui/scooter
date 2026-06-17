import { PropsWithChildren } from "react";
import { AppShell } from "@/components/dashboard/app-shell";
import { AuthGuard } from "@/components/dashboard/auth-guard";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
