import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock3, Percent, Plus, Save, Search, Tag, Trash2 } from 'lucide-react';
import { ShellTitle } from '../components/ShellTitle';
import { useToast } from '../components/Toast';
import { authenticatedImageUrl } from '../api';
import { Dropdown } from '../components/Dropdown';
import type { PriceListItem, Role } from '../types';

const blankItem = (): PriceListItem => ({ name: '', durationMinutes: 60, price: 0, discountPercent: 0, discountPrice: 0, offerText: '', active: true });

export function PriceListScreen({ role, items, onBack, onSave }: { role: Role; items: PriceListItem[]; onBack: () => void; onSave?: (items: PriceListItem[]) => void | Promise<void> }) {
  const [draft, setDraft] = useState(items);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const { showToast } = useToast();
  useEffect(() => setDraft(items), [items]);
  useEffect(() => setPage(1), [query, category]);
  const update = (index: number, changes: Partial<PriceListItem>) => setDraft(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item));
  const add = () => setDraft(current => [...current, blankItem()]);
  const remove = (index: number) => setDraft(current => current.filter((_, itemIndex) => itemIndex !== index));
  const save = async () => {
    if (!onSave) return;
    const invalid = draft.find(item => !item.name.trim() || Number(item.durationMinutes) < 1 || Number(item.price) < 0 || Number(item.discountPercent || 0) < 0 || Number(item.discountPercent || 0) > 100 || (Number(item.discountPrice || 0) > 0 && Number(item.discountPrice) >= Number(item.price)));
    if (invalid) { const text = 'Check service names, prices, durations, and discount values before saving.'; setMessage(text); showToast(text, 'error'); return; }
    const cleaned = draft.filter(item => item.name.trim()).map(item => ({ ...item, name: item.name.trim(), price: Number(item.price) || 0, durationMinutes: Number(item.durationMinutes) || 0, discountPercent: Number(item.discountPercent) || 0, discountPrice: Number(item.discountPrice) || 0 }));
    setSaving(true); setMessage('');
    try { await onSave(cleaned); setMessage(''); showToast('Price list saved. Guests can now see the latest offers.'); } catch (error) { const text = error instanceof Error ? error.message : 'Could not save the price list.'; setMessage(text); showToast(text, 'error'); }
    finally { setSaving(false); }
  };
  const published = items.filter(item => item.active !== false);
  const categories = ['All', 'Hair', 'Nails & spa', 'Other'];
  const getCategory = (item: PriceListItem) => { const name = item.name.toLowerCase(); if (name.includes('eyelash') || name.includes('eyebrow')) return 'Other'; if (name.includes('manicure') || name.includes('pedicure') || name.includes('nail') || name.includes('massage') || name.includes('foot')) return 'Nails & spa'; return 'Hair'; };
  const matches = (item: PriceListItem) => (!query.trim() || item.name.toLowerCase().includes(query.trim().toLowerCase()) || item.offerText?.toLowerCase().includes(query.trim().toLowerCase())) && (category === 'All' || getCategory(item) === category);
  const visibleDraft = draft.filter(matches);
  const visiblePublished = published.filter(matches);
  const pageSize = 6;
  const sourceItems = role === 'admin' ? visibleDraft : visiblePublished;
  const pageCount = Math.max(1, Math.ceil(sourceItems.length / pageSize));
  const pageItems = sourceItems.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => setPage(current => Math.min(current, pageCount)), [pageCount]);
  return <section className="page price-list">
    <ShellTitle eyebrow={role === 'admin' ? 'STUDIO CATALOG' : 'SALON MENU'} title={role === 'admin' ? 'Prices and offers, kept current.' : 'Choose what feels right for you.'} copy={role === 'admin' ? 'Add services, set prices, and publish discounts for guests.' : 'Browse the salon services, durations, and current offers.'} back={role === 'admin' ? 'Back to studio data' : 'Back to appointments'} onBack={onBack} action={role === 'admin' ? <button className="primary" disabled={saving} onClick={() => void save()}><Save size={16}/>{saving ? 'Saving...' : 'Save price list'}</button> : <span className="guest-pill">CURRENT PRICES</span>}/>
    {message && <p className="save-error passport-message">{message}</p>}
    <div className="catalog-filters"><label className="catalog-search"><Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search services or offers"/></label><label className="catalog-category"><span>Category</span><Dropdown value={category} options={categories.map(item => ({ value: item, label: item }))} onChange={setCategory} ariaLabel="Service category"/></label>{(query || category !== 'All') && <button className="text-button" onClick={() => { setQuery(''); setCategory('All'); }}>Clear filters</button>}</div>
    {role === 'admin' ? <section className="panel form-panel price-editor">
      <div className="section-label"><span className="round-icon peach"><Tag size={16}/></span><div><b>Services and discounts</b><small>Only active services appear in the guest menu.</small></div></div>
      {pageItems.map(item => { const index = draft.indexOf(item); return <div className="price-editor-row" key={`${item.name}-${index}`}>
        <div className="price-editor-main">
          <input value={item.name} placeholder="Service name" onChange={event => update(index, { name: event.target.value })}/>
          <label><span>Duration</span><div className="input-with-icon"><Clock3 size={14}/><input type="number" min="1" value={item.durationMinutes} onChange={event => update(index, { durationMinutes: Number(event.target.value) })}/><small>min</small></div></label>
          <label><span>Regular price</span><input type="number" min="0" value={item.price} onChange={event => update(index, { price: Number(event.target.value) })}/></label>
          <label><span>Discount %</span><div className="input-with-icon"><Percent size={14}/><input type="number" min="0" max="100" value={item.discountPercent || 0} onChange={event => update(index, { discountPercent: Number(event.target.value) })}/></div></label>
          <label><span>Offer price</span><input type="number" min="0" value={item.discountPrice || 0} onChange={event => update(index, { discountPrice: Number(event.target.value) })}/></label>
          <input value={item.offerText || ''} placeholder="Offer label, e.g. New guest offer" onChange={event => update(index, { offerText: event.target.value })}/>
          <label className="preference-row"><input type="checkbox" checked={item.active !== false} onChange={event => update(index, { active: event.target.checked })}/>Published for guests</label>
        </div>
        <button className="icon-button" title="Remove service" onClick={() => remove(index)}><Trash2 size={15}/></button>
      </div>; })}
      <button className="soft" onClick={add}><Plus size={15}/>Add service</button>
      {!draft.length && <p className="empty-appointments">No services yet. Add the first service to publish your menu.</p>}{draft.length > 0 && !visibleDraft.length && <p className="empty-appointments">No services match the selected filters.</p>}
    </section> : <section className="price-grid">
      {pageItems.map(item => { const hasOffer = Boolean(item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.price); const displayPrice = hasOffer ? item.discountPrice || item.price : item.price; return <article className="panel price-card" key={item.name}>
        <div className="price-card-media">
          <img className="price-card-image" src={authenticatedImageUrl(item.imageUrl || '/images/hair-airy.svg')} alt={`${item.name} service`}/>
          <span className="price-card-category">{getCategory(item)}</span>
          {hasOffer && <span className="offer-pill"><Percent size={13}/>{item.discountPercent ? `${item.discountPercent}% off` : 'Offer'}</span>}
        </div>
        <div className="price-card-content">
          <div className="price-card-top"><span className="round-icon sage"><Tag size={16}/></span></div>
          <h2>{item.name}</h2><p><Clock3 size={14}/>{item.durationMinutes} minutes</p>
          <div className="price-values">{hasOffer && <del>₹{item.price.toLocaleString('en-IN')}</del>}<strong>₹{displayPrice.toLocaleString('en-IN')}</strong></div>
          {item.offerText && <small className="offer-text">{item.offerText}</small>}
        </div>
      </article>; })}
      {!published.length && <section className="panel empty-appointments"><Tag size={20}/><p>The salon has not published its price list yet.</p></section>}{published.length > 0 && !visiblePublished.length && <section className="panel empty-appointments"><Search size={20}/><p>No services match the selected filters.</p></section>}
    </section>}
    {pageCount > 1 && <div className="catalog-pagination"><span>Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, sourceItems.length)} of {sourceItems.length}</span><div><button className="icon-button" title="Previous page" disabled={page === 1} onClick={() => setPage(current => Math.max(1, current - 1))}><ChevronLeft size={16}/></button><b>Page {page} of {pageCount}</b><button className="icon-button" title="Next page" disabled={page === pageCount} onClick={() => setPage(current => Math.min(pageCount, current + 1))}><ChevronRight size={16}/></button></div></div>}
  </section>;
}
