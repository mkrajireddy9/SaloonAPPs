import { useMemo, useState } from 'react';
import { ArrowUpRight, Check, ClipboardList, Search, Settings2, Users, WalletCards } from 'lucide-react';
import { ShellTitle } from '../components/ShellTitle';
import type { DashboardSummary } from '../types';

type ServiceCategory = 'All' | 'Hair' | 'Nails & spa' | 'Other';

function getServiceCategory(name: string): Exclude<ServiceCategory, 'All'> {
  const value = name.toLowerCase();
  if (value.includes('eyelash') || value.includes('eyebrow')) return 'Other';
  if (value.includes('manicure') || value.includes('pedicure') || value.includes('nail') || value.includes('massage') || value.includes('foot')) {
    return 'Nails & spa';
  }
  return 'Hair';
}

export function AdminStudioScreen({
  data,
  onBack,
  onOpenPassport,
  onOpenSalon,
}: {
  data: DashboardSummary;
  onBack: () => void;
  onOpenPassport: () => void;
  onOpenSalon: () => void;
}) {
  const [query, setQuery] = useState('');
  const [serviceQuery, setServiceQuery] = useState('');
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>('All');

  const filteredCustomers = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return data.customers;
    return data.customers.filter((customer) => customer.name.toLowerCase().includes(value));
  }, [data.customers, query]);

  const filteredServices = useMemo(() => {
    const value = serviceQuery.trim().toLowerCase();
    return data.services.filter((service) => {
      const matchesText = !value || service.name.toLowerCase().includes(value);
      const matchesCategory = serviceCategory === 'All' || getServiceCategory(service.name) === serviceCategory;
      return matchesText && matchesCategory;
    });
  }, [data.services, serviceCategory, serviceQuery]);

  return (
    <section className="page studio-data">
      <ShellTitle
        eyebrow="THE STUDIO AT A GLANCE"
        title="A clearer view of the work."
        copy="Keep an eye on consultations, customer relationships and the services guests are choosing."
        back="Back to today"
        onBack={onBack}
        action={
          <button className="soft" onClick={onOpenSalon}>
            Set up salon <Settings2 size={15} />
          </button>
        }
      />

      <div className="data-stats">
        <div className="panel data-stat">
          <Users size={18} />
          <span>Consultations</span>
          <strong>{data.consultations}</strong>
          <small><ArrowUpRight size={13} /> From PostgreSQL</small>
        </div>
        <div className="panel data-stat">
          <Check size={18} />
          <span>Service conversion</span>
          <strong>{data.serviceConversion}%</strong>
          <small><ArrowUpRight size={13} /> From PostgreSQL</small>
        </div>
        <div className="panel data-stat">
          <WalletCards size={18} />
          <span>Average visit value</span>
          <strong>₹{data.averageVisitValue.toLocaleString('en-IN')}</strong>
          <small><ArrowUpRight size={13} /> From PostgreSQL</small>
        </div>
      </div>

      <section className="panel consultation-log">
        <div className="panel-head">
          <div>
            <label>THE CONSULTATION BOOK</label>
            <h2>Saved consultation details</h2>
          </div>
          <ClipboardList size={20} />
        </div>
        {data.recentConsultations.map((item) => (
          <div className="consultation-log-row" key={item.id}>
            <div className="consultation-log-main">
              <b>{item.guestName}</b>
              <span>{item.goal}</span>
              <small>{item.stylist} · {item.length} · {item.texture}</small>
            </div>
            <div className="consultation-log-meta">
              <em className={`consultation-status ${item.status}`}>{item.status}</em>
              <small>{new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
            </div>
          </div>
        ))}
        {!data.recentConsultations.length && <p className="no-results">Saved consultation details will appear here after the report is saved.</p>}
      </section>

      <div className="data-grid">
        <section className="panel customer-table">
          <div className="panel-head">
            <div>
              <label>THE CLIENT BOOK</label>
              <h2>Customer search</h2>
            </div>
            <div className="search-field">
              <Search size={15} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guests" />
            </div>
          </div>
          {filteredCustomers.map((customer) => (
            <div className="customer-row" key={customer.name}>
              <span className="avatar sage">{customer.name.split(' ').map((part) => part[0]).join('')}</span>
              <div><b>{customer.name}</b><small>{customer.profile}</small></div>
              <span><small>Last visit</small><b>{customer.last}</b></span>
              <span><small>Visits</small><b>{customer.visits}</b></span>
              <button className="text-button" onClick={onOpenPassport}>Open passport</button>
            </div>
          ))}
          {filteredCustomers.length === 0 && <p className="no-results">No database customers match that search.</p>}
        </section>

        <section className="panel catalog">
          <div className="panel-head">
            <div>
              <label>SERVICE CATALOG</label>
              <h2>What guests choose</h2>
            </div>
            <button className="soft" onClick={onOpenSalon}>Edit catalog</button>
          </div>
          <div className="studio-catalog-filter">
            <div className="search-field">
              <Search size={15} />
              <input value={serviceQuery} onChange={(event) => setServiceQuery(event.target.value)} placeholder="Search services" />
            </div>
            <select className="catalog-filter-select" value={serviceCategory} onChange={(event) => setServiceCategory(event.target.value as ServiceCategory)} aria-label="Filter services by category">
              <option>All</option>
              <option>Hair</option>
              <option>Nails &amp; spa</option>
              <option>Other</option>
            </select>
          </div>
          <small className="catalog-result-count">Showing {filteredServices.length} of {data.services.length} services</small>
          <div className="studio-catalog-list">
            {filteredServices.map((service) => (
              <div className="service-row" key={service.name}>
                <div><b>{service.name}</b><small>{service.bookings} bookings</small></div>
                <strong>{service.revenue}</strong>
                <Check size={15} />
              </div>
            ))}
            {!filteredServices.length && <p className="catalog-empty">No services match this filter.</p>}
          </div>
        </section>
      </div>
    </section>
  );
}
