"use client";

interface BarChartProps {
    data: Array<{ label: string; value: number }>;
    title?: string;
    height?: number;
    color?: string;
}

export default function BarChart({ data, title, height = 160, color = "var(--primary)" }: BarChartProps) {
    const max = Math.max(...data.map(d => d.value), 1);

    return (
        <div className="w-full">
            {title && <p className="text-sm font-medium text-muted-foreground mb-3">{title}</p>}
            <div className="flex items-end gap-1 w-full" style={{ height }}>
                {data.map((d, i) => {
                    const heightPct = (d.value / max) * 100;
                    return (
                        <div
                            key={i}
                            className="flex-1 flex flex-col items-center justify-end gap-1 group"
                        >
                            <div className="relative w-full flex justify-center">
                                {/* Tooltip */}
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs px-2 py-0.5 rounded border border-border whitespace-nowrap z-10 pointer-events-none">
                                    {d.value}
                                </div>
                                {/* Bar */}
                                <div
                                    className="w-full rounded-t-sm transition-all duration-500 ease-out min-h-[2px]"
                                    style={{
                                        height: `${Math.max(heightPct, 2)}%`,
                                        maxHeight: `${height - 24}px`,
                                        background: color,
                                        opacity: d.value === 0 ? 0.15 : 0.85,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* X-axis labels */}
            <div className="flex gap-1 mt-1 w-full">
                {data.map((d, i) => (
                    <div key={i} className="flex-1 text-center">
                        <span className="text-[9px] text-muted-foreground truncate block">{d.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
