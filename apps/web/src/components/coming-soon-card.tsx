import { Card } from "@/components/ui";

type ComingSoonCardProps = {
  milestone: string;
  title: string;
  summary: string;
};

export function ComingSoonCard({ milestone, title, summary }: ComingSoonCardProps) {
  return (
    <Card className="space-y-3 border-border/80 bg-white/88 shadow-[0_14px_40px_rgba(80,54,31,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{milestone}</p>
      <h2 className="font-display text-2xl text-foreground">{title}</h2>
      <p className="text-sm leading-7 text-muted-foreground">{summary}</p>
    </Card>
  );
}
