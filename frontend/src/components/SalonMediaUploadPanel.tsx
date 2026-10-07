import { useMemo, useState } from 'react';
import { ImagePlus, Scissors, Trash2, UserRound, Upload } from 'lucide-react';
import { authenticatedImageUrl, deleteMedia, uploadFile } from '../api';
import { useToast } from './Toast';
import { Dropdown } from './Dropdown';
import type { SalonConfig } from '../types';

export function SalonMediaUploadPanel({ config, onSave }: { config: SalonConfig; onSave: (config: SalonConfig) => void | Promise<void> }) {
  const { showToast } = useToast();
  const [kind, setKind] = useState<'service' | 'stylist'>('service');
  const [name, setName] = useState(config.services[0] || '');
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const services = useMemo(() => config.serviceDetails || config.services.map(service => ({ name: service, durationMinutes: 60, price: 0, imageUrl: '' })), [config]);
  const currentImage = kind === 'service' ? services.find(item => item.name === name)?.imageUrl : config.stylistProfiles?.[name]?.imageUrl;
  const names = kind === 'service' ? config.services : config.stylists;
  const changeKind = (next: 'service' | 'stylist') => { setKind(next); setName(next === 'service' ? config.services[0] || '' : config.stylists[0] || ''); };
  const saveImage = async (file: File | undefined) => {
    if (!file || !name) return;
    setUploading(true);
    try {
      const previousImage = currentImage;
      if (!consentGiven) { showToast('Please confirm image storage consent before uploading.', 'error'); return; }
      const asset = await uploadFile(file, consentGiven);
      const imageUrl = `${(typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || 'http://localhost:3000'}${asset.url}`;
      const next = kind === 'service'
        ? { ...config, serviceDetails: services.map(item => item.name === name ? { ...item, imageUrl } : item) }
        : { ...config, stylistProfiles: { ...(config.stylistProfiles || {}), [name]: { bio: config.stylistProfiles?.[name]?.bio || '', imageUrl } } };
      await onSave(next);
      if (previousImage && previousImage !== imageUrl) await deleteMedia(previousImage);
      showToast(`${kind === 'service' ? 'Service' : 'Stylist'} image saved.`);
    } catch (error) { showToast(error instanceof Error ? error.message : 'Could not save this image.', 'error'); }
    finally { setUploading(false); }
  };
  const removeImage = async () => {
    if (!currentImage || !name || !window.confirm(`Remove the ${kind} image for ${name}?`)) return;
    setRemoving(true);
    try {
      await deleteMedia(currentImage);
      const next = kind === 'service'
        ? { ...config, serviceDetails: services.map(item => item.name === name ? { ...item, imageUrl: '' } : item) }
        : { ...config, stylistProfiles: { ...(config.stylistProfiles || {}), [name]: { bio: config.stylistProfiles?.[name]?.bio || '', imageUrl: '' } } };
      await onSave(next);
      showToast(`${kind === 'service' ? 'Service' : 'Stylist'} image removed.`);
    } catch (error) { showToast(error instanceof Error ? error.message : 'Could not remove this image.', 'error'); }
    finally { setRemoving(false); }
  };
  return <section className="panel media-upload-panel"><div className="section-label"><span className="round-icon sage"><ImagePlus size={16} /></span><div><b>Private image uploads</b><small>Validated images are stored through the protected media API.</small></div></div><div className="media-upload-tabs"><button className={kind === 'service' ? 'soft' : 'text-button'} onClick={() => changeKind('service')}><Scissors size={14} />Service image</button><button className={kind === 'stylist' ? 'soft' : 'text-button'} onClick={() => changeKind('stylist')}><UserRound size={14} />Stylist image</button></div><label className="preference-row"><input type="checkbox" checked={consentGiven} onChange={event => setConsentGiven(event.target.checked)} />I confirm this image may be stored for salon use and deleted when requested.</label><div className="media-upload-row"><Dropdown value={name} options={names.map(item => ({ value: item, label: item }))} onChange={setName} ariaLabel={kind === 'service' ? 'Select service image' : 'Select stylist image'} /><label className="soft media-upload-button"><Upload size={15} />{uploading ? 'Uploading...' : currentImage ? 'Replace image' : 'Choose image'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading || removing || !name || !consentGiven} onChange={event => void saveImage(event.target.files?.[0])} /></label>{currentImage && <button type="button" className="icon-button media-delete-button" title="Remove image" aria-label="Remove image" disabled={uploading || removing} onClick={() => void removeImage()}><Trash2 size={15} /></button>}</div>{currentImage && <img className="media-upload-preview" src={authenticatedImageUrl(currentImage)} alt={`${name} preview`} />}</section>;
}
