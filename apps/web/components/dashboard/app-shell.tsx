"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Menu, NotebookTabs, ReceiptText, Settings, Bike, Wallet } from "lucide-react";
import { PropsWithChildren, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/scooters", label: "Scooters", icon: Bike },
  { href: "/dashboard/rentals", label: "Rentals", icon: NotebookTabs },
  { href: "/dashboard/history", label: "History", icon: ReceiptText },
  { href: "/dashboard/reports", label: "Reports", icon: Wallet },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

export const AppShell = ({ children }: PropsWithChildren) => {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <aside className="flex h-full w-80 flex-col border-r border-border/70 bg-card/90 backdrop-blur">
      <div className="border-b border-border/70 px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Internal Admin</p>
        <h1 className="mt-3 font-display text-2xl font-bold">Scooter Rental HQ</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage scooter inventory, active trips, payments, and ID records.</p>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border/70 px-4 py-4">
        <div className="rounded-2xl border border-border/70 bg-background/60 p-4">
          <p className="text-sm font-semibold">{admin?.username ?? "Admin"}</p>
          <p className="mt-1 text-xs text-muted-foreground">{admin?.email ?? "Admin session"}</p>
          <Button
            variant="outline"
            className="mt-4 w-full justify-center"
            onClick={() => {
              logout();
              router.refresh();
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.15),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.12),transparent_25%)]" />
      <div className="absolute inset-0 -z-10 bg-admin-grid bg-[size:42px_42px] [mask-image:linear-gradient(to_bottom,rgba(255,255,255,0.65),transparent)]" />
      <div className="lg:hidden">
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur">
          <Button variant="outline" size="icon" onClick={() => setMobileOpen((value) => !value)}>
            <Menu className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <p className="font-display text-lg font-bold">Scooter Rental HQ</p>
            <p className="text-xs text-muted-foreground">Admin dashboard</p>
          </div>
          <ThemeToggle />
        </div>
        {mobileOpen ? (
          <div className="fixed inset-0 z-30 flex bg-slate-950/45 backdrop-blur-sm">
            <div className="h-full max-w-[85vw] flex-1">{sidebar}</div>
            <button className="flex-1" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          </div>
        ) : null}
      </div>

      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <div className="hidden lg:block">{sidebar}</div>
        <main className="flex-1">
          <div className="flex items-center justify-end gap-3 px-4 pb-2 pt-6 md:px-8 lg:px-10">
            <ThemeToggle />
          </div>
          <div className="px-4 pb-10 md:px-8 lg:px-10">{children}</div>
        </main>
      </div>
    </div>
  );
};
