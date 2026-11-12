import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Copy, RefreshCw, ShieldOff } from "lucide-react";
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
};

export function PlatformSalonsScreen({ onBack }: { onBack: () => void }) {
  const { showToast } = useToast();
  const [salons, setSalons] = useState<PlatformSalon[]>([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const refresh = () =>
    void request<PlatformSalon[]>("/salon/platform/salons")
      .then(setSalons)
      .catch(() => setSalons([]));

  useEffect(() => refresh(), []);

  const create = async () => {
    if (!name.trim() || !location.trim()) return;
    try {
      await request("/salon/platform/salons", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), location: location.trim() }),
      });
      setName("");
      setLocation("");
      refresh();
      showToast("Salon created. Share its tenant code with the salon admin.");
    } catch {
      showToast("Could not create the salon.", "error");
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
        copy="Create tenant workspaces, control availability, and share secure login codes with salon admins."
        back="Back to today"
        onBack={onBack}
      />
      <section className="platform-salon-create panel">
        <div className="section-label">
          <span className="round-icon sage"><Building2 size={17} /></span>
          <div><b>Create a salon workspace</b><small>Each salon gets its own tenant and login code.</small></div>
        </div>
        <div className="platform-salon-form">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Salon name" aria-label="Salon name" />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" aria-label="Location" />
          <button className="primary" onClick={() => void create()}>Create salon</button>
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
              <span className="platform-salon-id">{salon.ownerId ? "Admin connected" : "Awaiting admin"}</span>
            </div>
            <div className="tenant-code-row">
              <div><small>TENANT LOGIN CODE</small><strong>{salon.tenantCode || "Not assigned"}</strong></div>
              {salon.tenantCode && <button className="icon-button" title="Copy tenant code" onClick={() => void copyCode(salon.tenantCode)}><Copy size={15} /></button>}
            </div>
            <div className="platform-salon-actions">
              <button className="soft" onClick={() => void updateStatus(salon)}>{salon.active ? "Deactivate" : "Activate"}</button>
              <button className="soft" onClick={() => void rotateCode(salon)}><RefreshCw size={14} /> Rotate code</button>
            </div>
          </article>
        ))}
        {!salons.length && <div className="panel empty-platform-salons"><Building2 size={20} /><b>No platform salons yet</b><p>Create the first salon workspace above.</p></div>}
      </div>
    </section>
  );
}
