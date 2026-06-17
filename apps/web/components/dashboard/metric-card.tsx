import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const MetricCard = ({
  title,
  value,
  detail,
  icon: Icon
}: {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) => (
  <Card className="overflow-hidden">
    <CardContent className="relative p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-orange-400 to-amber-300" />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="font-display text-3xl font-bold tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
        <span className="rounded-2xl bg-primary/10 p-3 text-primary">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </CardContent>
  </Card>
);
