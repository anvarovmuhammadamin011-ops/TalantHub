import { useEffect, useRef, useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import EmptyState from "../ui/EmptyState";

export default function DonutChart({ data, height = 190 }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  // Deliberately not using recharts' <ResponsiveContainer> here: it measures its container via
  // its own internal ResizeObserver, and when the chart mounts inside a CSS grid cell whose row
  // height isn't settled yet, that first measurement can come back 0 and the pie never recovers
  // (unlike Bar/Line charts, Pie computes its sector geometry once from the size available at
  // mount and doesn't re-derive it later) — reproduced consistently on this dashboard, not just
  // a one-off dev glitch. Measuring the wrapper ourselves and only mounting PieChart once we have
  // a real pixel width sidesteps that race entirely.
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!data.length || total === 0) {
    return <EmptyState icon="📊" title="Hozircha ma'lumot yo'q" description="Yetarli ma'lumot to'planganda diagramma shu yerda ko'rinadi." />;
  }

  return (
    <div>
      <div ref={containerRef} style={{ height }}>
        {width > 0 && (
          <PieChart width={width} height={height}>
            <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={80} dataKey="value" paddingAngle={3}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 12 }} />
          </PieChart>
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-ink-2 truncate max-w-[9rem]">{d.name}</span>
            <span className="font-medium text-ink">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
