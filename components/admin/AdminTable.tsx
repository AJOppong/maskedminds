"use client";

interface Column<T> {
    key: keyof T | string;
    label: string;
    render?: (row: T) => React.ReactNode;
}

interface Action<T> {
    label: string;
    variant?: "danger" | "warning" | "default";
    onClick: (row: T) => void;
    disabled?: (row: T) => boolean;
    icon?: React.ReactNode;
}

interface AdminTableProps<T> {
    columns: Column<T>[];
    data: T[];
    actions?: Action<T>[];
    emptyMessage?: string;
    isLoading?: boolean;
    keyField: keyof T;
}

export default function AdminTable<T extends Record<string, unknown>>({
    columns,
    data,
    actions,
    emptyMessage = "No data found",
    isLoading = false,
    keyField,
}: AdminTableProps<T>) {
    const variantClass: Record<string, string> = {
        danger: "text-red-400 hover:bg-red-500/10 hover:text-red-300 border-red-500/20",
        warning: "text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 border-amber-500/20",
        default: "text-muted-foreground hover:bg-secondary hover:text-foreground border-border",
    };

    if (isLoading) {
        return (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Loading data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-secondary/30">
                            {columns.map(col => (
                                <th
                                    key={String(col.key)}
                                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                                >
                                    {col.label}
                                </th>
                            ))}
                            {actions && actions.length > 0 && (
                                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (actions ? 1 : 0)}
                                    className="px-4 py-12 text-center text-muted-foreground"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, idx) => (
                                <tr
                                    key={String(row[keyField])}
                                    className={`border-b border-border last:border-0 transition-colors hover:bg-secondary/20 ${idx % 2 === 0 ? "" : "bg-secondary/10"}`}
                                >
                                    {columns.map(col => (
                                        <td key={String(col.key)} className="px-4 py-3 text-foreground/90">
                                            {col.render
                                                ? col.render(row)
                                                : String(row[col.key as keyof T] ?? "—")}
                                        </td>
                                    ))}
                                    {actions && actions.length > 0 && (
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                {actions.map(action => (
                                                    <button
                                                        key={action.label}
                                                        onClick={() => action.onClick(row)}
                                                        disabled={action.disabled?.(row) ?? false}
                                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${variantClass[action.variant ?? "default"]}`}
                                                    >
                                                        {action.icon && <span className="w-3 h-3">{action.icon}</span>}
                                                        {action.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
