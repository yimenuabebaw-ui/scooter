"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, ScanFace } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await login(loginValue, password);
      toast.success("Login successful");
      startTransition(() => {
        router.replace("/dashboard");
        router.refresh();
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.18),transparent_28%)]" />
      <div className="absolute inset-0 bg-admin-grid bg-[size:44px_44px] opacity-40" />
      <div className="relative grid w-full max-w-6xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="surface-fade hidden overflow-hidden lg:block">
          <CardContent className="flex h-full flex-col justify-between p-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Internal Access</p>
              <h1 className="mt-4 max-w-xl font-display text-5xl font-bold leading-tight">
                Scooter rentals, fleet status, payments, and identity records in one admin console.
              </h1>
              <p className="mt-5 max-w-xl text-base text-muted-foreground">
                This interface is limited to authenticated staff. Monitor live rentals, change pricing, and export revenue
                summaries without exposing any public booking surface.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-border/70 bg-background/55 p-5">
                <ScanFace className="h-6 w-6 text-primary" />
                <p className="mt-3 font-display text-xl font-semibold">ID Handling</p>
                <p className="mt-2 text-sm text-muted-foreground">Validated uploads for front and back national ID images.</p>
              </div>
              <div className="rounded-3xl border border-border/70 bg-background/55 p-5">
                <LockKeyhole className="h-6 w-6 text-primary" />
                <p className="mt-3 font-display text-xl font-semibold">JWT Protection</p>
                <p className="mt-2 text-sm text-muted-foreground">Dashboard routes and API requests require an active admin session.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/92">
          <CardHeader className="pb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Admin Login</p>
            <CardTitle className="text-3xl">Sign in to Scooter Rental HQ</CardTitle>
            <CardDescription>Use your username or email and your admin password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={submit}>
              <div className="grid gap-2">
                <Label htmlFor="login">Username or Email</Label>
                <Input
                  id="login"
                  value={loginValue}
                  onChange={(event) => setLoginValue(event.target.value)}
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
              <Button type="submit" className="mt-2" disabled={submitting}>
                {submitting ? <Spinner /> : null}
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
