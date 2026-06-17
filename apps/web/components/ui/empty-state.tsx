import { Card, CardContent } from "./card";

export const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <Card>
    <CardContent className="flex min-h-40 flex-col items-center justify-center gap-2 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);
