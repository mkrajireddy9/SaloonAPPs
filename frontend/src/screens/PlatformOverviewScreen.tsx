import { useEffect, useState } from "react";
import { BarChart3, Building2, CalendarDays, CheckCircle2 } from "lucide-react";
import { ShellTitle } from "../components/ShellTitle";
import { request } from "../api";

type PlatformItem = {
  salon: { id: string; name: string; active: boolean };
  metrics: { totalBookings: number; confirmedBookings: number; revenue: number };
  consultations: number;
};

export function PlatformOverviewScreen({ onManage }: { onManage: () => void }) {
  const [items, setItems] = useState<PlatformItem[]>([]);
  useEffect(() => {
    void request<{ items: PlatformItem[] }>("/dashboard/platform")
      .then((result) => setItems(result.items))
      .catch(() => setItems([]));
  }, []);
  const active = items.filter((item) => item.salon.active).length;
  const inactive = items.length - active;
  const bookings = items.reduce((sum, item) => sum + item.metrics.totalBookings, 0);
  const revenue = items.reduce((sum, item) => sum + item.metrics.revenue, 0);
  const activeShare = items.length ? Math.round((active / items.length) * 100) : 0;
  const chartItems = [...items]
    .sort((a, b) => b.metrics.totalBookings - a.metrics.totalBookings)
    .slice(0, 6);
  const maxBookings = Math.max(...chartItems.map((item) => item.metrics.totalBookings), 1);
  const maxRevenue = Math.max(...chartItems.map((item) => item.metrics.revenue), 1);
  return (
    <section className="page platform-overview-page">
      <ShellTitle
        eyebrow="PLATFORM ADMINISTRATION"
        title="Platform overview."
        copy="Monitor tenant health and platform-wide salon activity."
        back="Manage tenants"
        onBack={onManage}
      />
      <div className="metrics-grid">
        <div className="panel metric-card"><Building2 size={18} /><b>{items.length}</b><span>Total salons</span></div>
        <div className="panel metric-card"><CheckCircle2 size={18} /><b>{active}</b><span>Active salons</span></div>
        <div className="panel metric-card"><CalendarDays size={18} /><b>{bookings}</b><span>Total bookings</span></div>
        <div className="panel metric-card"><BarChart3 size={18} /><b>₹{revenue.toLocaleString("en-IN")}</b><span>Confirmed revenue</span></div>
      </div>
      <div className="platform-charts-grid">
        <section className="panel platform-chart-card">
          <div className="chart-heading"><div><b>Salon health</b><small>Active tenant coverage</small></div><BarChart3 size={18} /></div>
          <div className="health-chart">
            <div className="health-donut" style={{ background: `conic-gradient(var(--rust) ${activeShare}%, #dfe8e2 0)` }}>
              <div><b>{activeShare}%</b><span>active</span></div>
            </div>
            <div className="health-legend">
              <span><i className="legend-dot active" />Active <strong>{active}</strong></span>
              <span><i className="legend-dot inactive" />Inactive <strong>{inactive}</strong></span>
              <small>{items.length ? `${items.length} total salons` : "No salons yet"}</small>
            </div>
          </div>
        </section>
        <section className="panel platform-chart-card">
          <div className="chart-heading"><div><b>Bookings by salon</b><small>Top tenants by booking volume</small></div><CalendarDays size={18} /></div>
          {chartItems.length ? <div className="bar-chart" aria-label="Bookings by salon">
            {chartItems.map((item) => <div className="bar-row" key={item.salon.id}>
              <div className="bar-label"><span title={item.salon.name}>{item.salon.name}</span><b>{item.metrics.totalBookings}</b></div>
              <div className="bar-track"><i style={{ width: `${(item.metrics.totalBookings / maxBookings) * 100}%` }} /></div>
            </div>)}
          </div> : <p className="chart-empty">No booking data is available yet.</p>}
        </section>
      </div>
      <section className="panel platform-chart-card revenue-chart-card">
        <div className="chart-heading"><div><b>Revenue by salon</b><small>Confirmed revenue contribution across tenants</small></div><BarChart3 size={18} /></div>
        {chartItems.length ? <div className="revenue-bars" aria-label="Revenue by salon">
          {chartItems.map((item) => <div className="revenue-bar-item" key={item.salon.id}>
            <div className="revenue-bar-value">₹{item.metrics.revenue.toLocaleString("en-IN")}</div>
            <div className="revenue-bar-track"><i style={{ height: `${(item.metrics.revenue / maxRevenue) * 100}%` }} /></div>
            <span title={item.salon.name}>{item.salon.name}</span>
          </div>)}
        </div> : <p className="chart-empty">No revenue data is available yet.</p>}
      </section>
      <section className="panel form-panel">
        <div className="section-label"><span className="round-icon sage"><Building2 size={16} /></span><div><b>Tenant activity</b><small>Aggregated platform metrics by salon.</small></div></div>
        {items.map((item) => <div className="review-row" key={item.salon.id}><div><b>{item.salon.name}</b><p>{item.salon.active ? "Active" : "Inactive"} · {item.metrics.totalBookings} bookings · {item.consultations} consultations</p></div><strong>₹{item.metrics.revenue.toLocaleString("en-IN")}</strong></div>)}
        {!items.length && <p>No salon data is available yet.</p>}
      </section>
    </section>
  );
}
