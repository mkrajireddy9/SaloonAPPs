import { useMemo, useState, type CSSProperties } from 'react';
import { ArrowUpRight, Check, ClipboardList, Filter, Search, Settings2, Users, WalletCards } from 'lucide-react';
import { ShellTitle } from '../components/ShellTitle';
import type { DashboardFilters, DashboardGroup, DashboardSummary } from '../types';

type ServiceCategory = 'All' | 'Hair' | 'Nails & spa' | 'Other';

function getServiceCategory(name: string): Exclude<ServiceCategory, 'All'> {
  const value = name.toLowerCase();
  if (value.includes('eyelash') || value.includes('eyebrow')) return 'Other';
  if (value.includes('manicure') || value.includes('pedicure') || value.includes('nail') || value.includes('massage') || value.includes('foot')) {
    return 'Nails & spa';
  }
  return 'Hair';
}

function ReportTable({ title, items, value }: { title: string; items: DashboardGroup[]; value: 'revenue' | 'bookings' }) {
  return <section className="panel analytics-report"><div className="panel-head"><div><label>OPERATIONAL REPORT</label><h2>{title}</h2></div></div>{items.slice(0, 8).map(item => <div className="analytics-row" key={item.name}><div><b>{item.date || item.name}</b><small>{item.bookings} bookings · {item.cancelled} cancelled</small></div><strong>{value === 'revenue' ? `₹${item.revenue.toLocaleString('en-IN')}` : item.bookings}</strong></div>)}{!items.length && <p className="no-results">No records match these filters.</p>}</section>;
}

function StatusPie({ items }: { items: { status: string; count: number }[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const colors = { Requested: '#d8b56c', Confirmed: '#72a18a', Cancelled: '#c36a54' } as Record<string, string>;
  let offset = 0;
  const segments = items.map(item => { const start = offset; offset += total ? (item.count / total) * 100 : 0; return `${colors[item.status] || '#b8c1ba'} ${start}% ${offset}%`; });
  const style = { '--pie-chart': total ? `conic-gradient(${segments.join(', ')})` : 'conic-gradient(#e5e2dc 0 100%)' } as CSSProperties;
  return <section className="panel status-pie-panel"><div className="panel-head"><div><label>BOOKING MIX</label><h2>Status at a glance</h2></div></div><div className="status-pie-content"><div className="status-pie" style={style}><span>{total}<small>bookings</small></span></div><div className="status-pie-legend">{items.map(item => <div key={item.status}><i style={{ background: colors[item.status] || '#b8c1ba' }} /><span>{item.status}</span><b>{total ? Math.round((item.count / total) * 100) : 0}%</b></div>)}</div></div></section>;
}

export function AdminStudioScreen({
  data,
  onBack,
  onOpenPassport,
  onOpenSalon,
  onFilterChange,
}: {
  data: DashboardSummary;
  onBack: () => void;
  onOpenPassport: () => void;
  onOpenSalon: () => void;
  onFilterChange: (filters: DashboardFilters) => void;
}) {
  const [query, setQuery] = useState('');
  const [serviceQuery, setServiceQuery] = useState('');
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>('All');
  const [filters, setFilters] = useState<DashboardFilters>({ dateFrom: '', dateTo: '', branchId: '', service: '', stylist: '', status: '' });
  const updateFilter = (key: keyof DashboardFilters, value: string) => { const next = { ...filters, [key]: value }; setFilters(next); onFilterChange(next); };

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
        copy="Track revenue, bookings, cancellations, service demand, and staff performance from PostgreSQL."
        back="Back to today"
        onBack={onBack}
        action={
          <button className="soft" onClick={onOpenSalon}>
            Set up salon <Settings2 size={15} />
          </button>
        }
      />

      <section className="panel analytics-filter-panel"><div className="panel-head"><div><label>OPERATING REPORT FILTERS</label><h2>Find the useful view</h2></div><Filter size={18} /></div><div className="analytics-filters"><input type="date" value={filters.dateFrom} onChange={event => updateFilter('dateFrom', event.target.value)} aria-label="Analytics start date"/><input type="date" value={filters.dateTo} onChange={event => updateFilter('dateTo', event.target.value)} aria-label="Analytics end date"/><select value={filters.branchId} onChange={event => updateFilter('branchId', event.target.value)}><option value="">All branches</option>{data.analytics.byBranch.map(branch => <option key={branch.id || branch.name} value={branch.id || branch.name}>{branch.name}</option>)}</select><select value={filters.service} onChange={event => updateFilter('service', event.target.value)}><option value="">All services</option>{data.services.map(item => <option key={item.name}>{item.name}</option>)}</select><select value={filters.stylist} onChange={event => updateFilter('stylist', event.target.value)}><option value="">All stylists</option>{data.analytics.byStylist.map(item => <option key={item.name}>{item.name}</option>)}</select><select value={filters.status} onChange={event => updateFilter('status', event.target.value)}><option value="">All statuses</option><option>Requested</option><option>Confirmed</option><option>Cancelled</option></select><button className="text-button" onClick={() => { const next = { dateFrom: '', dateTo: '', branchId: '', service: '', stylist: '', status: '' }; setFilters(next); onFilterChange(next); }}>Clear filters</button></div></section>

      <div className="data-stats">
        <div className="panel data-stat">
          <Users size={18} />
          <span>Total bookings</span>
          <strong>{data.analytics.totalBookings}</strong>
          <small><ArrowUpRight size={13} /> From PostgreSQL</small>
        </div>
        <div className="panel data-stat">
          <Check size={18} />
          <span>Confirmed bookings</span>
          <strong>{data.analytics.confirmedBookings}</strong>
          <small><ArrowUpRight size={13} /> From PostgreSQL</small>
        </div>
        <div className="panel data-stat">
          <WalletCards size={18} />
          <span>Confirmed revenue</span>
          <strong>₹{data.analytics.revenue.toLocaleString('en-IN')}</strong>
          <small><ArrowUpRight size={13} /> From PostgreSQL</small>
        </div>
        <div className="panel data-stat"><span>Cancellations</span><strong>{data.analytics.cancelledBookings}</strong><small><ArrowUpRight size={13} /> {data.analytics.cancellationRate}% of filtered bookings</small></div>
      </div>

      <div className="analytics-report-grid"><ReportTable title="Revenue by service" items={data.analytics.byService} value="revenue"/><ReportTable title="Bookings by branch" items={data.analytics.byBranch} value="bookings"/><ReportTable title="Daily operations" items={data.analytics.byDate} value="bookings"/></div><div className="analytics-visual-grid"><StatusPie items={data.analytics.statusBreakdown}/><section className="panel staff-report"><div className="panel-head"><div><label>TEAM PERFORMANCE</label><h2>Staff performance and workload</h2></div><Users size={19} /></div><div className="staff-report-list">{data.analytics.byStylist.map(item => <div className="staff-report-row" key={item.name}><div><b>{item.name}</b><small>{item.bookings} bookings · {item.averageDurationMinutes || 0} min average service</small></div><span><b>{item.conversionRate || 0}%</b><small>confirmed</small></span><span><b>₹{item.revenue.toLocaleString('en-IN')}</b><small>revenue</small></span><span><b>{item.cancelled}</b><small>cancelled</small></span></div>)}{!data.analytics.byStylist.length && <p className="no-results">Staff performance will appear after bookings are recorded.</p>}</div></section></div>

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
