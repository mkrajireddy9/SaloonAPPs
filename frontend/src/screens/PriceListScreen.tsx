import { useEffect, useState } from 'react';
import { Clock3, Percent, Plus, Save, Tag, Trash2 } from 'lucide-react';
import { ShellTitle } from '../components/ShellTitle';
import { useToast } from '../components/Toast';
import type { PriceListItem, Role } from '../types';

const blankItem = (): PriceListItem => ({ name: '', durationMinutes: 60, price: 0, discountPercent: 0, discountPrice: 0, offerText: '', active: true });

export function PriceListScreen({ role, items, onBack, onSave }: { role: Role; items: PriceListItem[]; onBack: () => void; onSave?: (items: PriceListItem[]) => void | Promise<void> }) {
  const [draft, setDraft] = useState(items);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const { showToast } = useToast();
  useEffect(() => setDraft(items), [items]);
  const update = (index: number, changes: Partial<PriceListItem>) => setDraft(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item));
  const add = () => setDraft(current => [...current, blankItem()]);
  const remove = (index: number) => setDraft(current => current.filter((_, itemIndex) => itemIndex !== index));
  const save = async () => {
    if (!onSave) return;
    const cleaned = draft.filter(item => item.name.trim()).map(item => ({ ...item, name: item.name.trim(), price: Number(item.price) || 0, durationMinutes: Number(item.durationMinutes) || 0, discountPercent: Number(item.discountPercent) || 0, discountPrice: Number(item.discountPrice) || 0 }));
    setSaving(true); setMessage('');
    try { await onSave(cleaned); setMessage(''); showToast('Price list saved. Guests can now see the latest offers.'); } catch (error) { const text = error instanceof Error ? error.message : 'Could not save the price list.'; setMessage(text); showToast(text, 'error'); }
    finally { setSaving(false); }
  };
  const published = items.filter(item => item.active !== false);
  return <section className="page price-list">
    <ShellTitle eyebrow={role === 'admin' ? 'STUDIO CATALOG' : 'SALON MENU'} title={role === 'admin' ? 'Prices and offers, kept current.' : 'Choose what feels right for you.'} copy={role === 'admin' ? 'Add services, set prices, and publish discounts for guests.' : 'Browse the salon services, durations, and current offers.'} back={role === 'admin' ? 'Back to studio data' : 'Back to appointments'} onBack={onBack} action={role === 'admin' ? <button className="primary" disabled={saving} onClick={() => void save()}><Save size={16}/>{saving ? 'Saving...' : 'Save price list'}</button> : <span className="guest-pill">CURRENT PRICES</span>}/>
    {message && <p className="save-error passport-message">{message}</p>}
    {role === 'admin' ? <section className="panel form-panel price-editor">
      <div className="section-label"><span className="round-icon peach"><Tag size={16}/></span><div><b>Services and discounts</b><small>Only active services appear in the guest menu.</small></div></div>
      {draft.map((item, index) => <div className="price-editor-row" key={`${item.name}-${index}`}>
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
      </div>)}
      <button className="soft" onClick={add}><Plus size={15}/>Add service</button>
      {!draft.length && <p className="empty-appointments">No services yet. Add the first service to publish your menu.</p>}
    </section> : <section className="price-grid">
      {published.map(item => { const hasOffer = Boolean(item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.price); const displayPrice = hasOffer ? item.discountPrice || item.price : item.price; return <article className="panel price-card" key={item.name}>
        {item.imageUrl && <img className="price-card-image" src={item.imageUrl} alt={`${item.name} service`}/>} 
        <div className="price-card-top"><span className="round-icon sage"><Tag size={16}/></span>{hasOffer && <span className="offer-pill"><Percent size={13}/>{item.discountPercent ? `${item.discountPercent}% off` : 'Offer'}</span>}</div>
        <h2>{item.name}</h2><p><Clock3 size={14}/>{item.durationMinutes} minutes</p>
        <div className="price-values">{hasOffer && <del>₹{item.price.toLocaleString('en-IN')}</del>}<strong>₹{displayPrice.toLocaleString('en-IN')}</strong></div>
        {item.offerText && <small className="offer-text">{item.offerText}</small>}
      </article>; })}
      {!published.length && <section className="panel empty-appointments"><Tag size={20}/><p>The salon has not published its price list yet.</p></section>}
    </section>}
  </section>;
}
