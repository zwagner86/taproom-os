import * as React from "react";

import { cn } from "@/lib/cn";

import { Card } from "./card";

interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  className?: string;
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  rows: T[];
  striped?: boolean;
}

export function DataTable<T>({
  className,
  columns,
  keyExtractor,
  rows,
  striped = false,
}: DataTableProps<T>) {
  return (
    <Card className={cn("overflow-hidden p-0", className)} style={{ padding: 0 }}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/60">
              {columns.map((column) => (
                <th
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                  key={column.key}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                className={cn(
                  "border-b border-border/80 last:border-b-0",
                  striped && index % 2 === 1 && "bg-secondary/35",
                )}
                key={keyExtractor(row)}
              >
                {columns.map((column) => (
                  <td className="px-4 py-3 align-middle" key={column.key}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
