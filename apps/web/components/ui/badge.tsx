import { cn } from "@/lib/utils";

const toneClasses = {
  available: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  rented: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  maintenance: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  active: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  neutral: "bg-muted text-muted-foreground"
} as const;

export const Badge = ({
  children,
  tone = "neutral",
  className
}: {
  children: React.ReactNode;
  tone?: keyof typeof toneClasses;
  className?: string;
}) => (
  <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", toneClasses[tone], className)}>
    {children}
  </span>
);
