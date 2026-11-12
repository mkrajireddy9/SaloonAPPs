import { useEffect, useState } from "react";
import { Building2, Check, CheckCircle2, Copy, RefreshCw, ShieldOff, X } from "lucide-react";
import { ShellTitle } from "../components/ShellTitle";
import { useToast } from "../components/Toast";
import { request } from "../api";

type PlatformSalon = {
  id: string;
  name: string;
  location: string;
  tenantCode: string | null;
  active: boolean;
  ownerId: string | null;
  admin?: {
    name: string;
    email: string;
    active: boolean;
    approvalStatus: string;
    lastLoginAt: string | null;
  } | null;
};
type PlatformMetrics = {
  salon: { id: string; name: string; active: boolean; tenantCode: string };
  metrics: { totalBookings: number; confirmedBookings: number; revenue: number };
  consultations: number;
};
type AdminRequest = {
  id: string;
  name: string;
  email: string;
  adminApprovalStatus: "pending" | "approved" | "rejected";
  emailVerified: boolean;
  createdAt: string;
  salon: { id: string; name: string; location: string; tenantCode: string } | null;
};

export function PlatformSalonsScreen({ onBack }: { onBack: () => void }) {
  const { showToast } = useToast();
  const [salons, setSalons] = useState<PlatformSalon[]>([]);
  const [metrics, setMetrics] = useState<PlatformMetrics[]>([]);
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const refresh = () => {
    void request<PlatformSalon[]>("/salon/platform/salons")
      .then(setSalons)
      .catch(() => setSalons([]));
    void request<{ items: PlatformMetrics[] }>("/dashboard/platform")
      .then((result) => setMetrics(result.items))
      .catch(() => setMetrics([]));
    void request<AdminRequest[]>("/auth/admin-requests")
      .then(setRequests)
      .catch(() => setRequests([]));
  };

  useEffect(() => refresh(), []);

  const formatDate = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value))
      : "Never";

  const updateRequest = async (id: string, approved: boolean) => {
    try {
      await request(`/auth/admin-requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ approved }),
      });
      refresh();
      showToast(approved ? "Admin request approved." : "Admin request rejected.");
    } catch {
      showToast("Could not update the admin request.", "error");
    }
  };
  const updateStatus = async (salon: PlatformSalon) => {
    try {
      await request(`/salon/platform/salons/${salon.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ active: !salon.active }),
      });
      refresh();
      showToast(salon.active ? "Salon deactivated." : "Salon activated.");
    } catch {
      showToast("Could not update the salon.", "error");
    }
  };
  const rotateCode = async (salon: PlatformSalon) => {
    try {
      await request(`/salon/platform/salons/${salon.id}/rotate-tenant-code`, {
        method: "POST",
      });
      refresh();
      showToast("Tenant code rotated.");
    } catch {
      showToast("Could not rotate the tenant code.", "error");
    }
  };
  const copyCode = async (code: string | null) => {
    if (!code) return;
    await navigator.clipboard?.writeText(code);
    showToast("Tenant code copied.");
  };

  return (
    <section className="page platform-salons-page">
      <ShellTitle
        eyebrow="PLATFORM ADMINISTRATION"
        title="Manage platform salons."
        copy="Review salon access requests, approve admins, and control tenant availability."
        back="Back to today"
        onBack={onBack}
      />
      <section className="platform-admin-requests panel">
        <div className="section-label">
          <span className="round-icon sage"><Building2 size={17} /></span>
          <div><b>Admin access requests</b><small>Approve a salon owner before they can sign in.</small></div>
        </div>
        <div className="admin-request-list">
          {requests.map((item) => <div className="admin-request-row" key={item.id}>
            <div>
              <b>{item.salon?.name || "Salon request"}</b>
              <p>{item.name} · {item.email} · {item.salon?.location || "Location not provided"}</p>
              <small>Requested {formatDate(item.createdAt)} · Email {item.emailVerified ? "verified" : "not verified"}</small>
            </div>
            <div className="admin-request-actions">
              <span className={`request-status ${item.adminApprovalStatus}`}>{item.adminApprovalStatus}</span>
              <button className="soft" onClick={() => void updateRequest(item.id, true)}><Check size={14} /> Approve</button>
              {item.adminApprovalStatus === "pending" && <button className="soft danger" onClick={() => void updateRequest(item.id, false)}><X size={14} /> Reject</button>}
            </div>
          </div>)}
          {!requests.length && <p className="admin-request-empty">No pending admin access requests.</p>}
        </div>
      </section>
      <div className="platform-salon-list">
        {salons.map((salon) => (
          <article className="platform-salon-card panel" key={salon.id}>
            <div className="platform-salon-card-head">
              <div>
                <span className={salon.active ? "status-chip active" : "status-chip inactive"}>
                  {salon.active ? <CheckCircle2 size={13} /> : <ShieldOff size={13} />}
                  {salon.active ? "Active" : "Inactive"}
                </span>
                <h2>{salon.name}</h2>
                <p>{salon.location || "Location not set"}</p>
              </div>
              <span className="platform-salon-id">
                {salon.admin?.approvalStatus === "pending" ? "Pending approval" : salon.ownerId ? "Admin connected" : "Awaiting admin"}
              </span>
            </div>
            <div className="tenant-code-row">
              <div><small>TENANT LOGIN CODE</small><strong>{salon.tenantCode || "Not assigned"}</strong></div>
              {salon.tenantCode && <button className="icon-button" title="Copy tenant code" onClick={() => void copyCode(salon.tenantCode)}><Copy size={15} /></button>}
            </div>
            <div className="platform-salon-admin">
              <small>SALON ADMIN</small>
              {salon.admin ? (
                <div>
                  <span>{salon.admin.name} · {salon.admin.email}</span>
                  <small>{salon.admin.active ? "Active" : "Inactive"} · Last login {formatDate(salon.admin.lastLoginAt)}</small>
                </div>
              ) : (
                <span>Awaiting admin registration</span>
              )}
            </div>
            <div className="platform-salon-actions">
              <button className="soft" onClick={() => void updateStatus(salon)}>{salon.active ? "Deactivate" : "Activate"}</button>
              <button className="soft" onClick={() => void rotateCode(salon)}><RefreshCw size={14} /> Rotate code</button>
            </div>
            {metrics.find((item) => item.salon.id === salon.id) && (
              <div className="platform-salon-metrics">
                {(() => {
                  const item = metrics.find((entry) => entry.salon.id === salon.id)!;
                  return <span>{item.metrics.totalBookings} bookings · {item.metrics.confirmedBookings} confirmed · ₹{item.metrics.revenue.toLocaleString("en-IN")}</span>;
                })()}
              </div>
            )}
          </article>
        ))}
        {!salons.length && <div className="panel empty-platform-salons"><Building2 size={20} /><b>No platform salons yet</b><p>Approved access requests will appear here.</p></div>}
      </div>
    </section>
  );
}
