import type { ReactNode } from "react";

import { cn } from "../lib/cn";
import { Card } from "./card";

interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyExtractor: (row: T) => string;
  striped?: boolean;
  className?: string;
}

export function DataTable<T>({ columns, rows, keyExtractor, striped = false, className }: DataTableProps<T>) {
  return (
    <Card style={{ padding: 0 }} className={cn(className)}>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ borderBottom: "1.5px solid var(--c-border)" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: "10px 12px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "var(--c-muted)",
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={keyExtractor(row)}
                style={{
                  borderBottom: i < rows.length - 1 ? "1px solid var(--c-border)" : "none",
                  background: striped && i % 2 !== 0 ? "oklch(98.5% 0.004 75)" : "transparent",
                }}
              >
                {columns.map((col) => (
                  <td key={col.key} style={{ padding: "11px 12px", verticalAlign: "middle" }}>
                    {col.render(row)}
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
