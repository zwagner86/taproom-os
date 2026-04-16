import { Card } from "@taproom/ui";

type ComingSoonCardProps = {
  milestone: string;
  title: string;
  summary: string;
};

export function ComingSoonCard({ milestone, title, summary }: ComingSoonCardProps) {
  return (
    <Card className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">{milestone}</p>
      <h2 className="font-display text-2xl text-ink">{title}</h2>
      <p className="text-sm leading-6 text-ink/70">{summary}</p>
    </Card>
  );
}

