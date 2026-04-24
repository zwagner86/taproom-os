import { Alert } from "@/components/ui";
import type { DemoMutationResult } from "@/lib/demo-venue-state";

export function DemoMutationAlert({
  onDismiss,
  result,
}: {
  onDismiss?: () => void;
  result: DemoMutationResult | null;
}) {
  if (!result) {
    return null;
  }

  return (
    <Alert onDismiss={onDismiss} variant="success">
      <div className="font-medium">{result.message}</div>
      <div className="mt-1 text-xs opacity-80">{result.detail}</div>
    </Alert>
  );
}
