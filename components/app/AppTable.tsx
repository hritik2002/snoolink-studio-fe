"use client"

import { cn } from "@/lib/utils"
import {
  appTableBodyCell,
  appTableContainer,
  appTableHeaderCell,
  appTableRow,
  appTableRowClickable,
} from "@/lib/app-classes"

export interface AppTableColumn<T> {
  key: string
  label: string
  width?: string
  render?: (row: T) => React.ReactNode
}

interface AppTableProps<T extends { id: string | number }> {
  columns: AppTableColumn<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
  className?: string
}

export function AppTable<T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data available",
  onRowClick,
  className,
}: AppTableProps<T>) {
  return (
    <div className={cn(appTableContainer, className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-app-border">
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={appTableHeaderCell}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className={appTableRow}>
                {columns.map((col) => (
                  <td key={col.key} className={appTableBodyCell}>
                    <div
                      className="h-4 bg-app-active rounded animate-pulse"
                      style={{ width: "60%" }}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center text-[14px] text-app-4 py-16"
                style={{ height: "200px", verticalAlign: "middle" }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? appTableRowClickable : appTableRow}
              >
                {columns.map((col) => (
                  <td key={col.key} className={appTableBodyCell}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
