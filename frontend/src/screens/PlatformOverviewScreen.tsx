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
  const bookings = items.reduce((sum, item) => sum + item.metrics.totalBookings, 0);
  const revenue = items.reduce((sum, item) => sum + item.metrics.revenue, 0);
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
      <section className="panel form-panel">
        <div className="section-label"><span className="round-icon sage"><Building2 size={16} /></span><div><b>Tenant activity</b><small>Aggregated platform metrics by salon.</small></div></div>
        {items.map((item) => <div className="review-row" key={item.salon.id}><div><b>{item.salon.name}</b><p>{item.salon.active ? "Active" : "Inactive"} · {item.metrics.totalBookings} bookings · {item.consultations} consultations</p></div><strong>₹{item.metrics.revenue.toLocaleString("en-IN")}</strong></div>)}
        {!items.length && <p>No salon data is available yet.</p>}
      </section>
    </section>
  );
}
