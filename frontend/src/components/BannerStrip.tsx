import { useEffect, useState } from 'react';
import { ArrowRight, Tag, X } from 'lucide-react';
import { request } from '../api';
type Banner = 
{ id: string; 
    title: string;
     message: string; 
     imageUrl?: string | null; actionLabel?: string | null; actionUrl?: string | null };
export function BannerStrip({ onNavigate }: { onNavigate?: (path: string) => void }) { 
    const [banners, setBanners] = useState<Banner[]>([]);
     const [dismissed, setDismissed] = useState<string[]>([]); 
     useEffect(() => { void request<Banner[]>('/banners').then(setBanners).catch(() => undefined); }, []); 
     const visible = banners.filter(item => !dismissed.includes(item.id)); if (!visible.length) return null; return <section className="promo-banners" aria-label="Salon offers"><div className="promo-banner-track">{visible.map((banner) => <article className="promo-banner" key={banner.id}><img className="promo-banner-image" src={banner.imageUrl || '/images/halo-promo-hair.png'} alt=""/><div className="promo-banner-overlay"><span className="promo-eyebrow"><Tag size={13}/> Featured offer</span><h2>{banner.title}</h2><p>{banner.message}</p>{banner.actionLabel && banner.actionUrl && <button className="promo-cta" type="button" onClick={() => { if (onNavigate) onNavigate(banner.actionUrl || ''); else { window.history.pushState({}, '', banner.actionUrl || '/'); window.dispatchEvent(new PopStateEvent('popstate')); } }}>{banner.actionLabel} <ArrowRight size={15}/></button>}</div><button type="button" className="promo-dismiss" aria-label="Dismiss offer" onClick={() => setDismissed(current => [...current, banner.id])}><X size={16}/></button></article>)}</div></section>; }
